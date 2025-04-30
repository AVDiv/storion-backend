import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { UserProfileService } from '../analytics/user-profile.service';
import { FeedQueryDto, FeedType, TimeRange } from './dto/feed-query.dto';
import { FeedArticleGroupDto, FeedResponseDto } from './dto/feed-response.dto';
import { TrackingConsentService } from '../validation-rules';

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly userProfileService: UserProfileService,
    private readonly trackingConsentService: TrackingConsentService,
  ) { }

  /**
   * Get a personalized feed for a user based on their profile preferences
   * @param userId The user's ID
   * @param query Feed query parameters
   */
  async getPersonalizedFeed(userId: string, query: FeedQueryDto): Promise<FeedResponseDto> {
    try {
      const response = new FeedResponseDto();
      response.limit = query.limit;
      response.offset = query.offset;

      // First check if user has tracking consent
      const hasConsent = await this.trackingConsentService.hasTrackingConsent(userId);

      if (!hasConsent) {
        // If no tracking consent, fall back to non-personalized feed
        this.logger.log(`User ${userId} has no tracking consent, providing non-personalized feed`);
        return this.getNonPersonalizedFeed(query);
      }

      // Get user profile
      const userProfile = await this.userProfileService.getOrCreateUserProfile({ id: userId });
      if (!userProfile) {
        this.logger.warn(`Could not find profile for user ${userId}, falling back to non-personalized feed`);
        return this.getNonPersonalizedFeed(query);
      }

      // Get read article IDs for potential exclusion
      const readArticleIds = query.excludeRead ?
        this.extractReadArticleIds(userProfile.clickHistory) : [];

      // Prepare time range filter based on query
      const timeFilter = this.getTimeFilterForRange(query.timeRange);

      // Choose appropriate feed strategy based on type
      let articleGroups: FeedArticleGroupDto[];
      switch (query.type) {
        case FeedType.RECOMMENDED:
          articleGroups = await this.getRecommendedFeed(userProfile, readArticleIds, query, timeFilter);
          break;
        case FeedType.TRENDING:
          articleGroups = await this.getTrendingFeed(readArticleIds, query, timeFilter);
          break;
        case FeedType.LATEST:
          articleGroups = await this.getLatestFeed(readArticleIds, query, timeFilter);
          break;
        case FeedType.MIXED:
        default:
          articleGroups = await this.getMixedFeed(userProfile, readArticleIds, query, timeFilter);
          break;
      }

      response.articleGroups = articleGroups;
      response.total = articleGroups.length;
      return response;
    } catch (error) {
      this.logger.error(`Error generating feed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a non-personalized feed for users without profiles or tracking consent
   */
  private async getNonPersonalizedFeed(query: FeedQueryDto): Promise<FeedResponseDto> {
    // Get a mix of trending and recent content
    const timeFilter = this.getTimeFilterForRange(query.timeRange);

    const articleGroups = await this.getTrendingFeed([], query, timeFilter);

    const response = new FeedResponseDto();
    response.articleGroups = articleGroups;
    response.total = articleGroups.length;
    response.offset = query.offset;
    response.limit = query.limit;

    return response;
  }

  /**
   * Get a recommended feed based on user preferences
   */
  private async getRecommendedFeed(
    userProfile: any,
    readArticleIds: string[],
    query: FeedQueryDto,
    timeFilter: string,
  ): Promise<FeedArticleGroupDto[]> {
    // Extract user preferences
    const shortTermPrefs = userProfile.shortTermPreferences || { categories: {}, tags: {} };
    const longTermPrefs = userProfile.longTermPreferences || { categories: {}, tags: {} };

    // Extract top categories and tags
    const topCategories = this.extractTopInterests(shortTermPrefs.categories, 5);
    const topTags = this.extractTopInterests(shortTermPrefs.tags, 10);

    // Include long-term preferences with lower weights
    const longTermCategories = this.extractTopInterests(longTermPrefs.categories, 3);
    const longTermTags = this.extractTopInterests(longTermPrefs.tags, 5);

    const excludeClause = readArticleIds.length > 0
      ? `AND NOT g.id IN $readArticleIds`
      : '';

    // Add topic filter if specified
    const topicFilterClause = query.topic
      ? `AND EXISTS {
          MATCH (g)-[r:FOCUSES_ON]->(t:Topic)
          WHERE toLower(t.name) = toLower($topicFilter)
        }`
      : '';

    // Modified query to ensure it always returns results from most to least matching
    const cypher = `
      // Match all article groups first to ensure results even without topic matches
      MATCH (g:ArticleGroup)
      WHERE datetime(g.created_at) ${timeFilter}
            ${excludeClause}
            ${topicFilterClause}
      
      // Optionally match topics to calculate relevance
      OPTIONAL MATCH (g)-[r:FOCUSES_ON]->(t:Topic)
      
      // Group by article group to handle aggregation
      WITH g, 
           // Calculate topic matching score (default to 0 when no matches)
           COALESCE(
             SUM(
               CASE 
                 WHEN t.name IN $topCategories THEN r.weight * 5
                 WHEN t.name IN $longTermCategories THEN r.weight * 2.5
                 WHEN t.name IN $topicNames THEN r.weight
                 ELSE 0
               END
             ), 0
           ) as topicScore,
           // Calculate recency (0-1 scale, newer = higher)
           CASE 
             WHEN g.created_at > datetime() - duration('P7D') THEN 1.0
             WHEN g.created_at > datetime() - duration('P14D') THEN 0.8
             WHEN g.created_at > datetime() - duration('P30D') THEN 0.6
             WHEN g.created_at > datetime() - duration('P90D') THEN 0.4
             ELSE 0.2
           END as recencyScore
      
      // Count related articles to factor in popularity
      OPTIONAL MATCH (g)<-[:BELONGS_TO_GROUP]-(article:Article)
      WITH g, topicScore, recencyScore, COUNT(article) as articleCount
      
      // Next, evaluate keyword matches
      WITH g, topicScore, recencyScore, articleCount,
           // Calculate tag relevance using Jaccard similarity with user's tag preferences
           CASE 
             WHEN g.keywords IS NOT NULL AND size(g.keywords) > 0 AND size($allTags) > 0 THEN
               size([tag IN g.keywords WHERE tag IN $allTags]) / toFloat(size(g.keywords))
             ELSE 0
           END as tagRelevance
      
      // Calculate a combined relevance score with weights for each factor
      WITH g, 
           topicScore * 0.4 +          // Topic matching (40%)  
           recencyScore * 0.3 +        // Recency (30%)
           tagRelevance * 0.2 +        // Tag matching (20%)
           log10(articleCount + 1) * 0.1  // Popularity (10%)
           as relevanceScore,
           CASE 
             WHEN topicScore > 0 AND size([tag IN g.keywords WHERE tag IN $topTags]) > 0 THEN 'Matches your interests'
             WHEN topicScore > 0 THEN 'Recommended topics'
             ELSE 'Content you might like'
           END as matchReason,
           g.keywords as keywords,
           articleCount
      
      // Return article groups sorted by relevance
      RETURN g.id as id,
             g.title as title,
             keywords,
             g.created_at as createdAt,
             g.updated_at as updatedAt,
             articleCount,
             // Collect topics with weights
             [(g)-[r:FOCUSES_ON]->(t:Topic) | {name: t.name, score: COALESCE(r.weight, 0)}] as topics,
             relevanceScore,
             matchReason
      ORDER BY relevanceScore DESC
      SKIP ${query.offset}
      LIMIT ${query.limit}
    `;

    // Combine all topic names for the query
    const allTopicNames = [...new Set([
      ...Object.keys(shortTermPrefs.categories),
      ...Object.keys(longTermPrefs.categories)
    ])];

    // Combine all tags for keyword matching
    const allTags = [...new Set([
      ...Object.keys(shortTermPrefs.tags),
      ...Object.keys(longTermPrefs.tags)
    ])];

    // Execute query
    const result = await this.neo4jService.read<FeedArticleGroupDto>(cypher, {
      topicNames: allTopicNames,
      topCategories: topCategories.map(item => item.name),
      longTermCategories: longTermCategories.map(item => item.name),
      topTags: topTags.map(item => item.name),
      allTags: allTags,
      readArticleIds: readArticleIds,
      topicFilter: query.topic || null
    });

    return this.formatArticleGroups(result);
  }

  /**
   * Get trending content based on recent engagement
   */
  private async getTrendingFeed(
    readArticleIds: string[],
    query: FeedQueryDto,
    timeFilter: string,
  ): Promise<FeedArticleGroupDto[]> {
    const excludeClause = readArticleIds.length > 0
      ? `AND NOT g.id IN $readArticleIds`
      : '';

    // Add topic filter if specified
    const topicFilterClause = query.topic
      ? `AND EXISTS {
          MATCH (g)-[r:FOCUSES_ON]->(t:Topic)
          WHERE toLower(t.name) = toLower($topicFilter)
        }`
      : '';

    // Modified query to always return results with appropriate scoring
    const cypher = `
      MATCH (g:ArticleGroup)
      WHERE datetime(g.created_at) ${timeFilter}
            ${excludeClause}
            ${topicFilterClause}
      
      // Count articles in each group for popularity
      OPTIONAL MATCH (g)<-[:BELONGS_TO_GROUP]-(a:Article)
      WITH g, COUNT(a) as articleCount
      
      // Calculate trending score based on article count and recency
      // Even with no articles, it will return results scored by recency
      WITH g, articleCount,
           CASE 
             WHEN g.created_at > datetime() - duration('P3D') THEN 1.2
             WHEN g.created_at > datetime() - duration('P7D') THEN 1.0
             WHEN g.created_at > datetime() - duration('P14D') THEN 0.8
             ELSE 0.6
           END as recencyFactor
      
      WITH g, articleCount, recencyFactor,
           COALESCE(articleCount * recencyFactor, recencyFactor) as trendingScore,
           CASE
             WHEN articleCount > 3 THEN 'Trending now'
             WHEN g.created_at > datetime() - duration('P3D') THEN 'Recently added'
             ELSE 'You might be interested'
           END as matchReason
      
      RETURN g.id as id,
             g.title as title,
             g.keywords as keywords,
             g.created_at as createdAt,
             g.updated_at as updatedAt,
             articleCount,
             // Use COALESCE to handle null values in topic relationship weights
             [(g)-[r:FOCUSES_ON]->(t:Topic) | {name: t.name, score: COALESCE(r.weight, 0)}] as topics,
             trendingScore as relevanceScore,
             matchReason
      ORDER BY trendingScore DESC
      SKIP ${query.offset}
      LIMIT ${query.limit}
    `;

    const result = await this.neo4jService.read<FeedArticleGroupDto>(cypher, {
      readArticleIds: readArticleIds,
      topicFilter: query.topic || null
    });

    return this.formatArticleGroups(result);
  }

  /**
   * Get latest content sorted by recency
   */
  private async getLatestFeed(
    readArticleIds: string[],
    query: FeedQueryDto,
    timeFilter: string,
  ): Promise<FeedArticleGroupDto[]> {
    const excludeClause = readArticleIds.length > 0
      ? `AND NOT g.id IN $readArticleIds`
      : '';

    // Add topic filter if specified
    const topicFilterClause = query.topic
      ? `AND EXISTS {
          MATCH (g)-[r:FOCUSES_ON]->(t:Topic)
          WHERE toLower(t.name) = toLower($topicFilter)
        }`
      : '';

    // Modified query to handle topic relationships properly and ensure results
    const cypher = `
      MATCH (g:ArticleGroup)
      WHERE datetime(g.created_at) ${timeFilter}
            ${excludeClause}
            ${topicFilterClause}
      
      // Count articles in each group
      OPTIONAL MATCH (g)<-[:BELONGS_TO_GROUP]-(a:Article)
      WITH g, COUNT(a) as articleCount
      
      // Calculate recency score for consistent sorting when created_at is the same
      WITH g, articleCount,
           CASE 
             WHEN g.created_at > datetime() - duration('P1D') THEN 1.5
             WHEN g.created_at > datetime() - duration('P3D') THEN 1.3
             WHEN g.created_at > datetime() - duration('P7D') THEN 1.1
             ELSE 1.0
           END as recencyScore
      
      RETURN g.id as id,
             g.title as title,
             g.keywords as keywords,
             g.created_at as createdAt,
             g.updated_at as updatedAt,
             articleCount,
             // Use COALESCE to handle null values in topic relationship weights
             [(g)-[r:FOCUSES_ON]->(t:Topic) | {name: t.name, score: COALESCE(r.weight, 0)}] as topics,
             recencyScore as relevanceScore,
             'Latest updates' as matchReason
      ORDER BY g.created_at DESC, recencyScore DESC, articleCount DESC
      SKIP ${query.offset}
      LIMIT ${query.limit}
    `;

    const result = await this.neo4jService.read<FeedArticleGroupDto>(cypher, {
      readArticleIds: readArticleIds,
      topicFilter: query.topic || null
    });

    return this.formatArticleGroups(result);
  }

  /**
   * Get a mixed feed that combines personalization with trending and recent content
   * for a well-balanced content discovery experience
   */
  private async getMixedFeed(
    userProfile: any,
    readArticleIds: string[],
    query: FeedQueryDto,
    timeFilter: string,
  ): Promise<FeedArticleGroupDto[]> {
    // Adjust limits to fetch portions of each feed type
    const personalizedLimit = Math.ceil(query.limit * 0.6); // 60% personalized
    const trendingLimit = Math.ceil(query.limit * 0.25);    // 25% trending
    const latestLimit = Math.ceil(query.limit * 0.15);      // 15% latest

    // Fetch all feed types in parallel
    const [recommended, trending, latest] = await Promise.all([
      this.getRecommendedFeed(
        userProfile,
        readArticleIds,
        { ...query, limit: personalizedLimit, offset: 0 },
        timeFilter
      ),

      this.getTrendingFeed(
        readArticleIds,
        { ...query, limit: trendingLimit, offset: 0 },
        timeFilter
      ),

      this.getLatestFeed(
        readArticleIds,
        { ...query, limit: latestLimit, offset: 0 },
        timeFilter
      )
    ]);

    // Combine results, avoiding duplicates
    const seenIds = new Set<string>();
    const combinedResults: FeedArticleGroupDto[] = [];

    // Helper to add items avoiding duplicates
    const addNonDuplicates = (items: FeedArticleGroupDto[]) => {
      for (const item of items) {
        if (!seenIds.has(item.id)) {
          combinedResults.push(item);
          seenIds.add(item.id);
        }
      }
    };

    // Add items in priority order
    addNonDuplicates(recommended);
    addNonDuplicates(trending);
    addNonDuplicates(latest);

    // Trim to requested limit and apply offset
    return combinedResults
      .slice(0, query.limit)
      .map(item => ({
        ...item,
        // Adjust relevance score to be 0-100
        relevanceScore: Math.round((item.relevanceScore || 0) * 100)
      }));
  }

  /**
   * Extract top N interests (categories or tags) from preference object
   */
  private extractTopInterests(
    preferences: Record<string, number>,
    count: number
  ): Array<{ name: string; weight: number }> {
    return Object.entries(preferences)
      .map(([name, weight]) => ({ name, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, count);
  }

  /**
   * Extract article IDs from click history that the user has read
   */
  private extractReadArticleIds(clickHistory: any[]): string[] {
    if (!clickHistory || !Array.isArray(clickHistory)) return [];

    return clickHistory
      .map(item => item.articleId)
      .filter(Boolean);
  }

  /**
   * Get appropriate Neo4j time filter based on time range
   */
  private getTimeFilterForRange(timeRange: TimeRange): string {
    switch (timeRange) {
      case TimeRange.DAY:
        return `> datetime() - duration('P1D')`;
      case TimeRange.WEEK:
        return `> datetime() - duration('P7D')`;
      case TimeRange.MONTH:
        return `> datetime() - duration('P30D')`;
      case TimeRange.YEAR:
        return `> datetime() - duration('P365D')`;
      case TimeRange.ALL:
      default:
        return `IS NOT NULL`; // No time restriction
    }
  }

  /**
   * Format and standardize article group results
   */
  private formatArticleGroups(result: any[]): FeedArticleGroupDto[] {
    return result.map(record => ({
      id: record.id,
      title: record.title,
      keywords: record.keywords || [],
      topics: Array.isArray(record.topics) ? record.topics : [],
      articleCount: record.articleCount || 0,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      relevanceScore: record.relevanceScore,
      matchReason: record.matchReason
    }));
  }
}
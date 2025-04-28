import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { SearchQueryDto, SearchType } from './dto/search-query.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { ArticleGroupResponseDto } from './dto/article-group-response.dto';
import { TopicResponseDto } from './dto/topic-response.dto';
import { SourceResponseDto } from './dto/source-response.dto';

@Injectable()
export class SearchService {
  constructor(private readonly neo4jService: Neo4jService) { }

  async search(searchQueryDto: SearchQueryDto): Promise<SearchResponseDto> {
    const { query, type } = searchQueryDto;
    // Ensure limit and offset are integers
    const limit = Math.floor(Number(searchQueryDto.limit));
    const offset = Math.floor(Number(searchQueryDto.offset));

    const searchResponse = new SearchResponseDto();
    searchResponse.total = 0;

    // Prepare the search term for case-insensitive matching
    const searchPattern = `(?i).*${query}.*`;
    const exactPattern = `(?i)^${query}$`;

    switch (type) {
      case SearchType.ARTICLE_GROUP:
        const articleGroups = await this.searchArticleGroups(searchPattern, exactPattern, query, limit, offset);
        searchResponse.articleGroups = articleGroups;
        searchResponse.total = articleGroups.length;
        break;
      case SearchType.TOPIC:
        const topics = await this.searchTopics(searchPattern, exactPattern, query, limit, offset);
        searchResponse.topics = topics;
        searchResponse.total = topics.length;
        break;
      case SearchType.SOURCE:
        const sources = await this.searchSources(searchPattern, exactPattern, query, limit, offset);
        searchResponse.sources = sources;
        searchResponse.total = sources.length;
        break;
      case SearchType.ALL:
      default:
        // For ALL, get more results initially so we can prioritize by relevance
        const initialLimit = Math.max(10, Math.floor(limit * 1.5));

        // Fetch all types of results with calculated relevance scores
        const [allArticleGroups, allTopics, allSources] = await Promise.all([
          this.searchArticleGroups(searchPattern, exactPattern, query, initialLimit, 0),
          this.searchTopics(searchPattern, exactPattern, query, initialLimit, 0),
          this.searchSources(searchPattern, exactPattern, query, initialLimit, 0)
        ]);

        // Combine all results and sort by relevance score
        const combinedResults = [
          ...allArticleGroups.map(item => ({ type: 'article_group', item })),
          ...allTopics.map(item => ({ type: 'topic', item })),
          ...allSources.map(item => ({ type: 'source', item }))
        ].sort((a, b) => (b.item.relevanceScore || 0) - (a.item.relevanceScore || 0));

        // Take the top results up to the limit
        const topResults = combinedResults.slice(0, limit);

        // Separate the results back into their respective arrays
        const prioritizedArticleGroups = topResults
          .filter(result => result.type === 'article_group')
          .map(result => result.item as ArticleGroupResponseDto);

        const prioritizedTopics = topResults
          .filter(result => result.type === 'topic')
          .map(result => result.item as TopicResponseDto);

        const prioritizedSources = topResults
          .filter(result => result.type === 'source')
          .map(result => result.item as SourceResponseDto);

        searchResponse.articleGroups = prioritizedArticleGroups;
        searchResponse.topics = prioritizedTopics;
        searchResponse.sources = prioritizedSources;
        searchResponse.total = topResults.length;
        break;
    }

    return searchResponse;
  }

  private async searchArticleGroups(
    searchPattern: string,
    exactPattern: string,
    originalQuery: string,
    limit: number,
    offset: number
  ): Promise<ArticleGroupResponseDto[]> {
    // Ensure integer values
    const intLimit = Math.floor(Number(limit));
    const intOffset = Math.floor(Number(offset));

    const cypher = `// cypher
      MATCH (g:ArticleGroup)
      WHERE g.title =~ $searchPattern OR g.summary =~ $searchPattern 
      OR ANY(keyword IN g.keywords WHERE keyword =~ $searchPattern)
      
      // Calculate relevance score based on multiple factors
      WITH g, 
           // Base score
           (CASE WHEN g.title =~ $exactPattern THEN 10.0 ELSE 0.0 END) +
           (CASE WHEN g.title =~ $searchPattern THEN 5.0 ELSE 0.0 END) +
           (CASE WHEN g.summary =~ $searchPattern THEN 3.0 ELSE 0.0 END) +
           (CASE WHEN ANY(keyword IN g.keywords WHERE keyword =~ $exactPattern) THEN 4.0 ELSE 0.0 END) +
           (CASE WHEN ANY(keyword IN g.keywords WHERE keyword =~ $searchPattern) THEN 2.0 ELSE 0.0 END) +
           
           // Bonus for exact title match
           (CASE WHEN toLower(g.title) = toLower($originalQuery) THEN 15.0 ELSE 0.0 END) +
           
           // Bonus for title containing query
           (CASE WHEN toLower(g.title) CONTAINS toLower($originalQuery) THEN 7.0 ELSE 0.0 END) AS relevanceScore
      
      // First count related articles
      OPTIONAL MATCH (g)<-[:BELONGS_TO_GROUP]-(a:Article)
      WITH g, COUNT(a) as articleCount, relevanceScore
      
      // Then collect topics
      OPTIONAL MATCH (g)-[r:FOCUSES_ON]->(t:Topic)
      WITH g, articleCount, relevanceScore, COLLECT({name: t.name, score: r.weight}) as topics
      
      // Normalize score separately (0-100 scale)
      WITH g, articleCount, topics, relevanceScore,
           (CASE WHEN relevanceScore > 0 THEN 
              CASE WHEN relevanceScore > 100.0 THEN 100.0 ELSE relevanceScore END
            ELSE 0.0 END) as normalizedScore
      
      RETURN g.id as id, 
             g.title as title, 
             g.summary as summary, 
             g.keywords as keywords,
             g.main_entities as mainEntities, 
             g.created_at as createdAt, 
             g.updated_at as updatedAt,
             articleCount,
             topics,
             normalizedScore as relevanceScore
      ORDER BY relevanceScore DESC, articleCount DESC
      SKIP ${intOffset}
      LIMIT ${intLimit}
    `;

    const result = await this.neo4jService.read<ArticleGroupResponseDto>(cypher, {
      searchPattern,
      exactPattern,
      originalQuery
    });

    return result.map(record => ({
      id: record.id,
      title: record.title,
      summary: record.summary,
      keywords: record.keywords || [],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      articleCount: record.articleCount,
      topics: record.topics?.filter(topic => topic.name),
      relevanceScore: record.relevanceScore
    }));
  }

  private async searchTopics(
    searchPattern: string,
    exactPattern: string,
    originalQuery: string,
    limit: number,
    offset: number
  ): Promise<TopicResponseDto[]> {
    // Ensure integer values
    const intLimit = Math.floor(Number(limit));
    const intOffset = Math.floor(Number(offset));

    const cypher = `// cypher
      MATCH (t:Topic)
      WHERE t.name =~ $searchPattern OR t.description =~ $searchPattern
      
      // Calculate relevance score based on multiple factors
      WITH t, 
           // Base score
           (CASE WHEN t.name =~ $exactPattern THEN 10.0 ELSE 0.0 END) +
           (CASE WHEN t.name =~ $searchPattern THEN 6.0 ELSE 0.0 END) +
           (CASE WHEN t.description =~ $searchPattern THEN 4.0 ELSE 0.0 END) +
           
           // Bonus for exact name match
           (CASE WHEN toLower(t.name) = toLower($originalQuery) THEN 15.0 ELSE 0.0 END) +
           
           // Bonus for name containing query
           (CASE WHEN toLower(t.name) CONTAINS toLower($originalQuery) THEN 8.0 ELSE 0.0 END) AS relevanceScore
      
      OPTIONAL MATCH (t)<-[:FOCUSES_ON]-(g:ArticleGroup)
      WITH t, COUNT(DISTINCT g) as articleGroupCount, relevanceScore
      
      // Normalize score (0-100 scale)
      WITH t, articleGroupCount, relevanceScore,
           (CASE WHEN relevanceScore > 0 THEN 
              CASE WHEN relevanceScore > 100.0 THEN 100.0 ELSE relevanceScore END
            ELSE 0.0 END) as normalizedScore
      
      RETURN t.name as name,
             t.description as description,
             t.created_at as createdAt,
             articleGroupCount,
             normalizedScore as relevanceScore
      ORDER BY relevanceScore DESC, articleGroupCount DESC
      SKIP ${intOffset}
      LIMIT ${intLimit}
    `;

    const result = await this.neo4jService.read<TopicResponseDto>(cypher, {
      searchPattern,
      exactPattern,
      originalQuery
    });

    return result.map(record => ({
      name: record.name,
      description: record.description,
      createdAt: record.createdAt,
      articleGroupCount: record.articleGroupCount,
      relevanceScore: record.relevanceScore
    }));
  }

  private async searchSources(
    searchPattern: string,
    exactPattern: string,
    originalQuery: string,
    limit: number,
    offset: number
  ): Promise<SourceResponseDto[]> {
    // Ensure integer values
    const intLimit = Math.floor(Number(limit));
    const intOffset = Math.floor(Number(offset));

    const cypher = `// cypher
      MATCH (s:Source)
      WHERE s.name =~ $searchPattern OR s.domain =~ $searchPattern
      
      // Calculate relevance score based on multiple factors
      WITH s, 
           // Base score
           (CASE WHEN s.name =~ $exactPattern THEN 10.0 ELSE 0.0 END) +
           (CASE WHEN s.name =~ $searchPattern THEN 6.0 ELSE 0.0 END) +
           (CASE WHEN s.domain =~ $searchPattern THEN 5.0 ELSE 0.0 END) +
           
           // Bonus for exact name match
           (CASE WHEN toLower(s.name) = toLower($originalQuery) THEN 15.0 ELSE 0.0 END) +
           
           // Bonus for name containing query
           (CASE WHEN toLower(s.name) CONTAINS toLower($originalQuery) THEN 8.0 ELSE 0.0 END) +
           
           // Bonus for domain containing query
           (CASE WHEN s.domain IS NOT NULL AND toLower(s.domain) CONTAINS toLower($originalQuery) THEN 7.0 ELSE 0.0 END) AS relevanceScore
      
      OPTIONAL MATCH (s)<-[:PUBLISHED_BY]-(a:Article)
      WITH s, COUNT(a) as articleCount, relevanceScore
      
      // Normalize score (0-100 scale)
      WITH s, articleCount, relevanceScore,
           (CASE WHEN relevanceScore > 0 THEN 
              CASE WHEN relevanceScore > 100.0 THEN 100.0 ELSE relevanceScore END
            ELSE 0.0 END) as normalizedScore
      
      RETURN s.id as id,
             s.name as name,
             s.domain as domain,
             s.created_at as createdAt,
             s.updated_at as updatedAt,
             articleCount,
             normalizedScore as relevanceScore
      ORDER BY relevanceScore DESC, articleCount DESC
      SKIP ${intOffset}
      LIMIT ${intLimit}
    `;

    const result = await this.neo4jService.read<SourceResponseDto>(cypher, {
      searchPattern,
      exactPattern,
      originalQuery
    });

    return result.map(record => ({
      id: record.id,
      name: record.name,
      domain: record.domain,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      articleCount: record.articleCount,
      relevanceScore: record.relevanceScore
    }));
  }
}
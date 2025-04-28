import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../../neo4j/neo4j.service';
import { NewsEventDetailDto } from './dto/news-event-detail.dto';
import { RelatedArticleDto, RelatedArticlesResponseDto } from './dto/related-articles.dto';

@Injectable()
export class NewsEventService {
  constructor(private readonly neo4jService: Neo4jService) { }

  /**
   * Get a news event (ArticleGroup) by its ID
   * @param id The unique identifier of the news event
   * @returns News event details without related articles
   */
  async getNewsEventById(id: string): Promise<NewsEventDetailDto | null> {
    const cypher = `
      MATCH (g:ArticleGroup {id: $id})
      
      // Count related articles
      OPTIONAL MATCH (g)<-[:BELONGS_TO_GROUP]-(a:Article)
      WITH g, COUNT(a) as articleCount
      
      // Collect topics with weights, only include relationships where removed is false or null
      OPTIONAL MATCH (g)-[r:FOCUSES_ON]->(t:Topic)
      WHERE r.removed IS NULL OR r.removed = false
      WITH g, articleCount, COLLECT({name: t.name, score: r.weight}) as topics
      
      RETURN g.id as id,
             g.title as title,
             g.summary as summary,
             g.keywords as keywords,
             g.main_entities as mainEntities,
             g.created_at as createdAt,
             g.updated_at as updatedAt,
             articleCount,
             topics
    `;

    const results = await this.neo4jService.read<NewsEventDetailDto>(cypher, { id });

    if (results.length === 0) {
      return null;
    }

    // Process the result
    return {
      id: results[0].id,
      title: results[0].title,
      summary: results[0].summary,
      keywords: results[0].keywords || [],
      createdAt: results[0].createdAt,
      updatedAt: results[0].updatedAt,
      articleCount: results[0].articleCount,
      topics: results[0].topics || [],
    };
  }

  /**
   * Get related articles for a news event (ArticleGroup)
   * @param id The unique identifier of the news event
   * @param options Pagination options
   * @returns List of related articles
   */
  async getRelatedArticles(
    id: string,
    options: { limit: number; offset: number }
  ): Promise<RelatedArticlesResponseDto | null> {
    // First check if the article group exists
    const exists = await this.newsEventExists(id);
    if (!exists) {
      return null;
    }

    const { limit, offset } = options;

    // Get total count in a separate query
    const countQuery = `
      MATCH (g:ArticleGroup {id: $id})<-[:BELONGS_TO_GROUP]-(a:Article)
      RETURN COUNT(a) as totalCount
    `;

    const countResult = await this.neo4jService.read<{ totalCount: number }>(countQuery, { id });
    const totalCount = countResult[0]?.totalCount || 0;

    // Get paginated articles
    const articlesQuery = `
      MATCH (g:ArticleGroup {id: $id})<-[:BELONGS_TO_GROUP]-(a:Article)
      OPTIONAL MATCH (a)-[:PUBLISHED_BY]->(s:Source)
      RETURN a.id as id,
             a.title as title,
             a.url as url,
             a.publication_date as publicationDate,
             a.updated_at as updatedAt,
             s.id as sourceId,
             s.name as sourceName
      ORDER BY a.publication_date DESC
      SKIP ${offset}
      LIMIT ${limit}
    `;

    const articles = await this.neo4jService.read<RelatedArticleDto>(articlesQuery, { id });

    return {
      articles,
      totalCount
    };
  }

  /**
   * Check if a news event (ArticleGroup) with the given ID exists
   * @param id The unique identifier of the news event
   * @returns boolean indicating if the news event exists
   */
  async newsEventExists(id: string): Promise<boolean> {
    const cypher = `
      MATCH (g:ArticleGroup {id: $id})
      RETURN count(g) > 0 as exists
    `;

    const results = await this.neo4jService.read<{ exists: boolean }>(cypher, { id });
    return results[0]?.exists || false;
  }
}
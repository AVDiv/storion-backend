import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../../neo4j/neo4j.service';
import { SourceResponseDto } from '../../search/dto/source-response.dto';
import { ArticleOfSourceDto } from './dto/article-of-source.dto';
import { create } from 'domain';

@Injectable()
export class SourceService {
  constructor(private readonly neo4jService: Neo4jService) { }

  /**
   * Get a source by its ID
   * @param id The unique identifier of the source
   * @returns Source details including related article count
   */
  async getSourceById(id: string): Promise<SourceResponseDto | null> {
    const cypher = `
      MATCH (s:Source {id: $id})
      OPTIONAL MATCH (s)<-[:PUBLISHED_BY]-(a:Article)
      WITH s, COUNT(a) as articleCount
      RETURN s.id as id,
             s.name as name,
             s.domain as domain,
             s.created_at as createdAt,
             s.updated_at as updatedAt,
             articleCount
    `;

    const results = await this.neo4jService.read<SourceResponseDto>(cypher, { id });

    if (results.length === 0) {
      return null;
    }

    return {
      id: results[0].id,
      name: results[0].name,
      domain: results[0].domain,
      createdAt: results[0].createdAt,
      updatedAt: results[0].updatedAt,
      articleCount: results[0].articleCount,
      relevanceScore: null
    };
  }

  /**
   * Check if a source with the given ID exists
   * @param id The unique identifier of the source
   * @returns boolean indicating if the source exists
   */
  async sourceExists(id: string): Promise<boolean> {
    const cypher = `
      MATCH (s:Source {id: $id})
      RETURN count(s) > 0 as exists
    `;

    const results = await this.neo4jService.read<{ exists: boolean }>(cypher, { id });
    return results[0]?.exists || false;
  }

  /**
   * Get articles published by a specific source
   * @param sourceId The unique identifier of the source
   * @param options Pagination options
   * @returns List of articles from the source
   */
  async getSourceArticles(sourceId: string, options: { limit: number, offset: number }) {
    const { limit, offset } = options;

    const cypher = `
      MATCH (a:Article)-[:PUBLISHED_BY]->(s:Source {id: $sourceId})
      OPTIONAL MATCH (a)-[:BELONGS_TO_GROUP]->(g:ArticleGroup)
      RETURN a.id as id,
             a.title as title,
             a.url as url,
             a.publication_date as publicationDate,
             COALESCE(a.updated_at, '') as updatedAt,
             g.id as groupId,
             g.title as groupTitle,
             a.language_bias as languageBias,
             a.political_bias_confidence as politicalBiasConfidence,
             a.political_bias_orientation as politicalBiasOrientation
      ORDER BY a.publication_date DESC
      SKIP ${offset}
      LIMIT ${limit}
    `;

    const articles = await this.neo4jService.read<ArticleOfSourceDto>(cypher, {
      sourceId,
      offset,
      limit,
    });

    return articles.map(article => ({
      id: article.id,
      title: article.title,
      url: article.url,
      publicationDate: article.publicationDate || null,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt || null,
      groupId: article.groupId,
      languageBias: article.languageBias,
      politicalBiasConfidence: article.politicalBiasConfidence,
      politicalBiasOrientation: article.politicalBiasOrientation
    }));
  }
}
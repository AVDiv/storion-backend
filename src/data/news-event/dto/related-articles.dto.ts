export class RelatedArticleDto {
  id: string;
  title: string;
  url?: string;
  publicationDate: string;
  updatedAt?: string;
  sourceId?: string;
  sourceName?: string;
}

export class RelatedArticlesResponseDto {
  articles: RelatedArticleDto[];
  totalCount: number;
}
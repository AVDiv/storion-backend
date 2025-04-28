export class ArticleGroupResponseDto {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  createdAt: string;
  updatedAt?: string;
  articleCount: number;
  topics?: Array<{ name: string; score: number }>;
  relevanceScore?: number;
}
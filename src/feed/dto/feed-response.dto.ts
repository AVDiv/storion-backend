import { Type } from 'class-transformer';

export class FeedArticleGroupDto {
  id: string;
  title: string;
  keywords: string[];
  topics: Array<{ name: string; score: number }>;
  articleCount: number;
  createdAt: string;
  updatedAt: string;
  relevanceScore?: number;
  matchReason?: string;
}

export class FeedResponseDto {
  @Type(() => FeedArticleGroupDto)
  articleGroups: FeedArticleGroupDto[];
  total: number;
  offset: number;
  limit: number;
}
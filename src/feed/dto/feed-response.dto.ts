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
  // Language bias properties
  overallLanguageBias?: number;
  unbiasedArticlesCount?: number;
  biasedArticlesCount?: number;
  // Political bias properties
  overallPoliticalBiasConfidence?: number;
  overallPoliticalBiasScore?: number; // Normalized score: negative for left-leaning, positive for right-leaning
  leftLeaningArticlesCount?: number;
  rightLeaningArticlesCount?: number;
  centerArticlesCount?: number;
  politicalBiasDistribution?: { [key: string]: number };
}

export class FeedResponseDto {
  @Type(() => FeedArticleGroupDto)
  articleGroups: FeedArticleGroupDto[];
  total: number;
  offset: number;
  limit: number;
}
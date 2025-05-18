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
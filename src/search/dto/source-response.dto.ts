export class SourceResponseDto {
  id: string;
  name: string;
  domain?: string;
  createdAt: string;
  updatedAt?: string;
  articleCount: number;
  relevanceScore?: number;
}
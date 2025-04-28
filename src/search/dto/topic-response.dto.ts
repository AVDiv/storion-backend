export class TopicResponseDto {
  name: string;
  description?: string;
  createdAt: string;
  articleGroupCount: number;
  relevanceScore?: number;
}
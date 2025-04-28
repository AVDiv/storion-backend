import { ArticleGroupResponseDto } from '../../../search/dto/article-group-response.dto';

export class NewsEventDetailDto extends ArticleGroupResponseDto {
  // Additional properties specific to detailed view can be added here
  relatedArticles?: Array<{
    id: string;
    title: string;
    url?: string;
    publicationDate: string;
    updatedAt?: string;
    sourceId?: string;
    sourceName?: string;
  }>;
}
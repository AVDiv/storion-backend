import { ArticleGroupResponseDto } from './article-group-response.dto';
import { SourceResponseDto } from './source-response.dto';
import { TopicResponseDto } from './topic-response.dto';

export class SearchResponseDto {
  articleGroups?: ArticleGroupResponseDto[];
  topics?: TopicResponseDto[];
  sources?: SourceResponseDto[];
  total: number;
}
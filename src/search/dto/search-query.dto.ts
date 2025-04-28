import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum SearchType {
  ARTICLE_GROUP = 'article_group',
  TOPIC = 'topic',
  SOURCE = 'source',
  ALL = 'all',
}

export class SearchQueryDto {
  @IsString()
  query: string;

  @IsEnum(SearchType)
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase())
  type: SearchType = SearchType.ALL;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit: number = 20;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  offset: number = 0;
}
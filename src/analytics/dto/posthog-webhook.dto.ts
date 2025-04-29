import { IsString, IsObject, IsOptional, ValidateNested, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class NewsEventCategoryDto {
  @IsString()
  name: string;

  @IsNumber()
  score: number;
}

export class PostHogEventPropertiesDto {
  @IsString()
  @IsOptional()
  $current_url?: string;

  @IsString()
  @IsOptional()
  $title?: string;

  @IsString()
  @IsOptional()
  $browser?: string;

  // New article data properties
  @IsString()
  @IsOptional()
  article_id?: string;

  @IsString()
  @IsOptional()
  article_title?: string;

  @IsArray()
  @IsOptional()
  article_tags?: string[];

  @IsArray()
  @Type(() => NewsEventCategoryDto)
  @IsOptional()
  article_categories?: NewsEventCategoryDto[];

  @IsNumber()
  @IsOptional()
  time_spent?: number;

  @IsObject()
  @IsOptional()
  article_data?: {
    id?: string;
    title?: string;
    categories?: string[];
    tags?: string[];
  };

  [key: string]: any; // Allow any additional properties
}

export class PostHogEventDto {
  @IsString()
  @IsOptional()
  uuid?: string;

  @IsString()
  @IsOptional()
  distinct_id?: string;

  @IsString()
  event: string;

  @IsString()
  @IsOptional()
  timestamp?: string;

  @IsObject()
  properties: PostHogEventPropertiesDto;
}

export class PostHogPersonPropertiesDto {
  @IsString()
  @IsOptional()
  email?: string;

  [key: string]: any; // Allow any additional properties
}

export class PostHogPersonDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsObject()
  properties: PostHogPersonPropertiesDto;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  url?: string;
}

export class PostHogWebhookDto {
  @ValidateNested()
  @Type(() => PostHogEventDto)
  event: PostHogEventDto;

  @ValidateNested()
  @Type(() => PostHogPersonDto)
  @IsOptional()
  person?: PostHogPersonDto;

  @IsObject()
  @IsOptional()
  groups?: Record<string, any>;

  @IsObject()
  @IsOptional()
  project?: {
    id?: number;
    name?: string;
    url?: string;
  };

  @IsObject()
  @IsOptional()
  source?: {
    name?: string;
    url?: string;
  };
}

export class BatchPostHogWebhookDto {
  events: PostHogEventDto[];
}
import { IsEnum, IsInt, IsOptional, Min, Max, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum FeedType {
  RECOMMENDED = 'recommended',
  TRENDING = 'trending',
  LATEST = 'latest',
  MIXED = 'mixed' // Default balanced mix
}

export enum TimeRange {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  ALL = 'all'
}

export class FeedQueryDto {
  @IsOptional()
  @IsEnum(FeedType)
  type?: FeedType = FeedType.MIXED;

  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange = TimeRange.WEEK;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  excludeRead?: boolean = true;

  @IsOptional()
  @IsString()
  topic?: string;
}
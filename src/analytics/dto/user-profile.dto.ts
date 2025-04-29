import { IsString, IsObject, IsArray, IsDate, IsOptional } from 'class-validator';

export class ClickHistoryItemDto {
  @IsString()
  articleId: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsArray()
  @IsOptional()
  categories?: string[];

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsDate()
  timestamp: Date;
}

export class PreferencesDto {
  @IsObject()
  categories: Record<string, number>;

  @IsObject()
  tags: Record<string, number>;
}

export class UserProfileDto {
  @IsString()
  userId: string;

  @IsObject()
  shortTermPreferences: PreferencesDto;

  @IsObject()
  longTermPreferences: PreferencesDto;

  @IsArray()
  clickHistory: ClickHistoryItemDto[];

  @IsDate()
  lastInteraction: Date;

  @IsDate()
  createdAt: Date;
}
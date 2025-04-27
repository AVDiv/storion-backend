import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class OnboardingUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  topics: string[];

  @IsBoolean()
  @IsNotEmpty()
  trackingConsent: boolean;
}
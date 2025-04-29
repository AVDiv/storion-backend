import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { UserProfileService } from './user-profile.service';
import { SessionTrackingService } from './session-tracking.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TextAnalysisService } from './text-analysis.service';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, UserProfileService, SessionTrackingService, TextAnalysisService],
  exports: [AnalyticsService, UserProfileService, SessionTrackingService, TextAnalysisService],
})
export class AnalyticsModule { }
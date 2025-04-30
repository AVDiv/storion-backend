import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ValidationRulesModule } from '../validation-rules/validation-rules.module';

@Module({
  imports: [
    Neo4jModule,
    AnalyticsModule,
    ValidationRulesModule
  ],
  controllers: [FeedController],
  providers: [FeedService],
  exports: [FeedService]
})
export class FeedModule { }
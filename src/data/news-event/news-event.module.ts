import { Module } from '@nestjs/common';
import { NewsEventController } from './news-event.controller';
import { NewsEventService } from './news-event.service';
import { Neo4jModule } from '../../neo4j/neo4j.module';

@Module({
  imports: [Neo4jModule],
  controllers: [NewsEventController],
  providers: [NewsEventService],
  exports: [NewsEventService],
})
export class NewsEventModule { }
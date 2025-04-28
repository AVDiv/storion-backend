import { Module } from '@nestjs/common';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { SourceController } from './source/source.controller';
import { SourceService } from './source/source.service';
import { NewsEventModule } from './news-event/news-event.module';

@Module({
  imports: [Neo4jModule, NewsEventModule],
  controllers: [SourceController],
  providers: [SourceService],
  exports: [SourceService],
})
export class DataModule { }
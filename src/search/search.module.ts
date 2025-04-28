import { Module } from '@nestjs/common';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SourceController } from '../data/source/source.controller';
import { SourceService } from '../data/source/source.service';

@Module({
  imports: [Neo4jModule],
  controllers: [SearchController, SourceController],
  providers: [SearchService, SourceService],
  exports: [SearchService, SourceService],
})
export class SearchModule { }
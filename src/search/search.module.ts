import { Module } from '@nestjs/common';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [Neo4jModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule { }
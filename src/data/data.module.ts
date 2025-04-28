import { Module } from '@nestjs/common';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { SourceController } from './source/source.controller';
import { SourceService } from './source/source.service';

@Module({
  imports: [Neo4jModule],
  controllers: [SourceController],
  providers: [SourceService],
  exports: [SourceService],
})
export class SearchModule { }
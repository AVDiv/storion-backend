import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Neo4jModule as NestNeo4jModule } from 'nest-neo4j';
import { Neo4jService } from './neo4j.service';

@Module({
  imports: [
    NestNeo4jModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        scheme: configService.get('neo4j.scheme'),
        host: configService.get('neo4j.host'),
        port: configService.get('neo4j.port'),
        username: configService.get('neo4j.username'),
        password: configService.get('neo4j.password'),
        database: configService.get('neo4j.database'),
      }),
    }),
  ],
  providers: [Neo4jService],
  exports: [Neo4jService],
})
export class Neo4jModule { }
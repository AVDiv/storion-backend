import { Injectable } from '@nestjs/common';
import { Neo4jService as NestNeo4jService } from 'nest-neo4j';

@Injectable()
export class Neo4jService {
  constructor(private readonly neo4jService: NestNeo4jService) { }

  /**
   * Execute a Cypher query
   */
  async read(cypher: string, params: Record<string, any> = {}) {
    const result = await this.neo4jService.read(cypher, params);
    return result.records.map(record => {
      const properties = {};
      record.keys.forEach(key => {
        properties[key] = this.getValue(record.get(key));
      });
      return properties;
    });
  }

  /**
   * Execute a Cypher query that writes to the database
   */
  async write(cypher: string, params: Record<string, any> = {}) {
    const result = await this.neo4jService.write(cypher, params);
    return result.records.map(record => {
      const properties = {};
      record.keys.forEach(key => {
        properties[key] = this.getValue(record.get(key));
      });
      return properties;
    });
  }

  /**
   * Helper method to convert Neo4j values to plain JavaScript values
   */
  private getValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    // Handle Neo4j Node objects
    if (value.constructor.name === 'Node') {
      const nodeProperties = {};
      const propertyKeys = value.properties ? Object.keys(value.properties) : [];
      propertyKeys.forEach(key => {
        nodeProperties[key] = this.getValue(value.properties[key]);
      });

      return {
        id: value.identity.low,
        labels: value.labels,
        ...nodeProperties
      };
    }

    // Handle Neo4j Integer objects
    if (value.constructor.name === 'Integer') {
      return value.toNumber();
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => this.getValue(item));
    }

    // Handle objects
    if (typeof value === 'object') {
      const objProperties = {};
      Object.keys(value).forEach(key => {
        objProperties[key] = this.getValue(value[key]);
      });
      return objProperties;
    }

    return value;
  }
}
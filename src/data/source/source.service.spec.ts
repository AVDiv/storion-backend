import { Test, TestingModule } from '@nestjs/testing';
import { SourceService } from './source.service';
import { Neo4jService } from '../../neo4j/neo4j.service';

describe('SourceService', () => {
  let service: SourceService;
  let neo4jService: Neo4jService;

  const mockNeo4jService = {
    read: vi.fn()
  };

  const mockSourceData = {
    id: 'source-123',
    name: 'Test News',
    domain: 'testnews.com',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    articleCount: 42
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SourceService,
        { provide: Neo4jService, useValue: mockNeo4jService }
      ],
    }).compile();

    service = module.get<SourceService>(SourceService);
    neo4jService = module.get<Neo4jService>(Neo4jService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSourceById', () => {
    it('should return a source when it exists', async () => {
      mockNeo4jService.read.mockResolvedValueOnce([mockSourceData]);

      const result = await service.getSourceById('source-123');

      expect(neo4jService.read).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (s:Source {id: $id})'),
        { id: 'source-123' }
      );
      expect(result).toEqual({
        ...mockSourceData,
        relevanceScore: null
      });
    });

    it('should return null when source does not exist', async () => {
      mockNeo4jService.read.mockResolvedValueOnce([]);

      const result = await service.getSourceById('non-existent');

      expect(result).toBeNull();
    });
  });
});
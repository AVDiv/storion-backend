import { Test, TestingModule } from '@nestjs/testing';
import { NewsEventService } from './news-event.service';
import { Neo4jService } from '../../neo4j/neo4j.service';

describe('NewsEventService', () => {
  let service: NewsEventService;
  let neo4jService: Neo4jService;

  const mockNeo4jService = {
    read: vi.fn()
  };

  const mockNewsEventData = {
    id: 'article-group-123',
    title: 'Test News Event',
    summary: 'This is a test news event summary',
    keywords: ['test', 'news', 'event'],
    mainEntities: ['Test Company', 'Test Person'],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    articleCount: 5,
    topics: [
      {
        name: 'Technology',
        score: 0.8
      }
    ]
  };

  const mockArticlesData = [
    {
      id: 'article-123',
      title: 'Related Article 1',
      url: 'https://example.com/article1',
      publicationDate: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z',
      sourceId: 'source-123',
      sourceName: 'Test Source'
    }
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsEventService,
        { provide: Neo4jService, useValue: mockNeo4jService }
      ],
    }).compile();

    service = module.get<NewsEventService>(NewsEventService);
    neo4jService = module.get<Neo4jService>(Neo4jService);

    // Reset mock calls before each test
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNewsEventById', () => {
    it('should return a news event when it exists', async () => {
      mockNeo4jService.read.mockResolvedValueOnce([mockNewsEventData]);

      const result = await service.getNewsEventById('article-group-123');

      expect(neo4jService.read).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (g:ArticleGroup {id: $id})'),
        { id: 'article-group-123' }
      );

      expect(result).toEqual(expect.objectContaining({
        id: mockNewsEventData.id,
        title: mockNewsEventData.title,
        summary: mockNewsEventData.summary,
        keywords: mockNewsEventData.keywords,
        articleCount: mockNewsEventData.articleCount,
        topics: mockNewsEventData.topics
      }));
    });

    it('should return null when news event does not exist', async () => {
      mockNeo4jService.read.mockResolvedValueOnce([]);

      const result = await service.getNewsEventById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getRelatedArticles', () => {
    it('should return related articles when news event exists', async () => {
      // Mock for newsEventExists check
      mockNeo4jService.read.mockResolvedValueOnce([{ exists: true }])
        // Mock for totalCount query
        .mockResolvedValueOnce([{ totalCount: 1 }])
        // Mock for articles query
        .mockResolvedValueOnce(mockArticlesData);

      const result = await service.getRelatedArticles('article-group-123', { limit: 10, offset: 0 });

      expect(neo4jService.read).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('MATCH (g:ArticleGroup {id: $id})'),
        { id: 'article-group-123' }
      );

      expect(result).toEqual({
        articles: mockArticlesData,
        totalCount: 1
      });
    });

    it('should return null when news event does not exist', async () => {
      mockNeo4jService.read.mockResolvedValueOnce([{ exists: false }]);

      const result = await service.getRelatedArticles('non-existent', { limit: 10, offset: 0 });

      expect(result).toBeNull();
    });
  });

  describe('newsEventExists', () => {
    it('should return true when news event exists', async () => {
      mockNeo4jService.read.mockResolvedValueOnce([{ exists: true }]);

      const result = await service.newsEventExists('article-group-123');

      expect(result).toBe(true);
    });

    it('should return false when news event does not exist', async () => {
      mockNeo4jService.read.mockResolvedValueOnce([{ exists: false }]);

      const result = await service.newsEventExists('non-existent');

      expect(result).toBe(false);
    });
  });
});
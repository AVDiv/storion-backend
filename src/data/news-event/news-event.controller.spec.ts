import { Test, TestingModule } from '@nestjs/testing';
import { NewsEventController } from './news-event.controller';
import { NewsEventService } from './news-event.service';
import { NotFoundException } from '@nestjs/common';

describe('NewsEventController', () => {
  let controller: NewsEventController;
  let service: NewsEventService;

  const mockNewsEventService = {
    getNewsEventById: vi.fn(),
    getRelatedArticles: vi.fn()
  };

  const mockNewsEvent = {
    id: 'article-group-123',
    title: 'Test News Event',
    summary: 'This is a test news event summary',
    keywords: ['test', 'news', 'event'],
    mainEntities: ['Test Company', 'Test Person'],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    articleCount: 5,
    topics: [{ name: 'Technology', score: 0.8 }],
    relevanceScore: null
  };

  const mockRelatedArticles = {
    articles: [
      {
        id: 'article-123',
        title: 'Related Article 1',
        url: 'https://example.com/article1',
        publicationDate: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        sourceId: 'source-123',
        sourceName: 'Test Source'
      }
    ],
    totalCount: 1
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewsEventController],
      providers: [
        { provide: NewsEventService, useValue: mockNewsEventService }
      ],
    }).compile();

    controller = module.get<NewsEventController>(NewsEventController);
    service = module.get<NewsEventService>(NewsEventService);

    // Reset mock calls before each test
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNewsEventById', () => {
    it('should return a news event when it exists', async () => {
      mockNewsEventService.getNewsEventById.mockResolvedValueOnce(mockNewsEvent);

      const result = await controller.getNewsEventById('article-group-123');

      expect(service.getNewsEventById).toHaveBeenCalledWith('article-group-123');
      expect(result).toEqual(mockNewsEvent);
    });

    it('should throw NotFoundException when news event does not exist', async () => {
      mockNewsEventService.getNewsEventById.mockResolvedValueOnce(null);

      await expect(controller.getNewsEventById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRelatedArticles', () => {
    it('should return related articles with default pagination', async () => {
      mockNewsEventService.getRelatedArticles.mockResolvedValueOnce(mockRelatedArticles);

      const result = await controller.getRelatedArticles('article-group-123');

      expect(service.getRelatedArticles).toHaveBeenCalledWith('article-group-123', {
        limit: 10,
        offset: 0
      });
      expect(result).toEqual(mockRelatedArticles);
    });

    it('should return related articles with custom pagination', async () => {
      mockNewsEventService.getRelatedArticles.mockResolvedValueOnce(mockRelatedArticles);

      const result = await controller.getRelatedArticles('article-group-123', 20, 10);

      expect(service.getRelatedArticles).toHaveBeenCalledWith('article-group-123', {
        limit: 20,
        offset: 10
      });
      expect(result).toEqual(mockRelatedArticles);
    });

    it('should handle invalid pagination parameters', async () => {
      mockNewsEventService.getRelatedArticles.mockResolvedValueOnce(mockRelatedArticles);

      // Test with negative values that should be corrected
      const result = await controller.getRelatedArticles('article-group-123', -5, -10);

      expect(service.getRelatedArticles).toHaveBeenCalledWith('article-group-123', {
        limit: 1, // Should be corrected to minimum value
        offset: 0  // Should be corrected to minimum value
      });
      expect(result).toEqual(mockRelatedArticles);
    });

    it('should throw NotFoundException when news event does not exist', async () => {
      mockNewsEventService.getRelatedArticles.mockResolvedValueOnce(null);

      await expect(controller.getRelatedArticles('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
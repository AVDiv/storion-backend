import { Test, TestingModule } from '@nestjs/testing';
import { SourceController } from './source.controller';
import { SourceService } from './source.service';
import { NotFoundException } from '@nestjs/common';

describe('SourceController', () => {
  let controller: SourceController;
  let sourceService: SourceService;

  const mockSourceService = {
    getSourceById: vi.fn(),
    getSourceArticles: vi.fn(),
    sourceExists: vi.fn()
  };

  const mockSource = {
    id: 'source-123',
    name: 'Test News',
    domain: 'testnews.com',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    articleCount: 42,
    relevanceScore: null
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SourceController],
      providers: [
        { provide: SourceService, useValue: mockSourceService }
      ],
    }).compile();

    controller = module.get<SourceController>(SourceController);
    sourceService = module.get<SourceService>(SourceService);

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSourceById', () => {
    it('should return the source when it exists', async () => {
      mockSourceService.getSourceById.mockResolvedValueOnce(mockSource);

      const result = await controller.getSourceById('source-123');

      expect(sourceService.getSourceById).toHaveBeenCalledWith('source-123');
      expect(result).toEqual(mockSource);
    });

    it('should throw NotFoundException when source does not exist', async () => {
      mockSourceService.getSourceById.mockResolvedValueOnce(null);

      await expect(controller.getSourceById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSourceArticles', () => {
    const mockArticles = [
      {
        id: 'article-1',
        title: 'Article 1',
        url: 'https://example.com/article1',
        publicationDate: '2023-04-01T00:00:00.000Z',
        group: { id: 'group-1', title: 'Group 1' }
      }
    ];

    it('should return source articles', async () => {
      mockSourceService.getSourceArticles.mockResolvedValue(mockArticles);

      const result = await controller.getSourceArticles('source-123', 10, 0);

      expect(result).toEqual({
        articles: mockArticles,
        meta: { limit: 10, offset: 0 }
      });
      expect(sourceService.getSourceArticles).toHaveBeenCalledWith('source-123', { limit: 10, offset: 0 });
    });

    it('should return empty array when no articles found but source exists', async () => {
      mockSourceService.getSourceArticles.mockResolvedValue([]);
      mockSourceService.sourceExists.mockResolvedValue(true);

      const result = await controller.getSourceArticles('source-123', 10, 0);

      expect(result).toEqual({
        articles: [],
        meta: { limit: 10, offset: 0 }
      });
      expect(sourceService.sourceExists).toHaveBeenCalledWith('source-123');
    });

    it('should throw NotFoundException when source does not exist', async () => {
      mockSourceService.getSourceArticles.mockResolvedValue([]);
      mockSourceService.sourceExists.mockResolvedValue(false);

      await expect(controller.getSourceArticles('invalid-id', 10, 0)).rejects.toThrow(NotFoundException);
    });
  });
});
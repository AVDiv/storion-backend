import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { NewsEventService } from './news-event.service';
import { NewsEventDetailDto } from './dto/news-event-detail.dto';
import { RelatedArticlesResponseDto } from './dto/related-articles.dto';

@Controller('news-events')
export class NewsEventController {
  constructor(private readonly newsEventService: NewsEventService) { }

  /**
   * Get a news event by ID
   * @param id The unique identifier of the news event
   * @returns Detailed information about the news event
   */
  @Get(':id')
  async getNewsEventById(@Param('id') id: string): Promise<NewsEventDetailDto> {
    const newsEvent = await this.newsEventService.getNewsEventById(id);

    if (!newsEvent) {
      throw new NotFoundException(`News event with ID ${id} not found`);
    }

    return newsEvent;
  }

  /**
   * Get related articles for a news event
   * @param id The unique identifier of the news event
   * @param limit Maximum number of articles to return
   * @param offset Number of articles to skip for pagination
   * @returns List of articles related to the news event
   */
  @Get(':id/articles')
  async getRelatedArticles(
    @Param('id') id: string,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0
  ): Promise<RelatedArticlesResponseDto> {
    // Parse and validate pagination parameters
    const parsedLimit = Math.min(Math.max(parseInt(limit.toString()) || 10, 1), 100);
    const parsedOffset = Math.max(parseInt(offset.toString()) || 0, 0);

    const result = await this.newsEventService.getRelatedArticles(id, {
      limit: parsedLimit,
      offset: parsedOffset
    });

    if (!result) {
      throw new NotFoundException(`News event with ID ${id} not found`);
    }

    return result;
  }
}
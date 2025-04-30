import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { FeedResponseDto } from './dto/feed-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) { }

  /**
   * Get a personalized feed of article groups for the authenticated user
   * based on their profile preferences and interaction history
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getPersonalizedFeed(
    @Request() req,
    @Query() query: FeedQueryDto
  ): Promise<FeedResponseDto> {
    return this.feedService.getPersonalizedFeed(req.user.userId, query);
  }
}
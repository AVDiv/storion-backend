import { Controller, Get, Param, NotFoundException, Query } from '@nestjs/common';
import { SourceResponseDto } from '../../search/dto/source-response.dto';
import { SourceService } from './source.service';

@Controller('source')
export class SourceController {
  constructor(private readonly sourceService: SourceService) { }

  @Get(':id')
  async getSourceById(@Param('id') id: string): Promise<SourceResponseDto> {
    const source = await this.sourceService.getSourceById(id);
    if (!source) {
      throw new NotFoundException(`Source with ID ${id} not found`);
    }
    return source;
  }

  @Get(':id/articles')
  async getSourceArticles(
    @Param('id') id: string,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0
  ) {
    const articles = await this.sourceService.getSourceArticles(id, { limit, offset });
    if (articles.length === 0 && offset === 0) {
      // Check if the source exists first
      const sourceExists = await this.sourceService.sourceExists(id);
      if (!sourceExists) {
        throw new NotFoundException(`Source with ID ${id} not found`);
      }
    }
    return { articles, meta: { limit, offset } };
  }
}
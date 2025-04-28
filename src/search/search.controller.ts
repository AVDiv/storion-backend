import { Controller, Get, Query } from '@nestjs/common';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) { }

  @Get()
  async search(
    @Query() searchQueryDto: SearchQueryDto,
  ): Promise<SearchResponseDto> {
    return this.searchService.search(searchQueryDto);
  }
}
import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Public } from '../../common/decorator/public.decorator'; 
import { SearchService } from './search.service';

@Public()
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // ── GET /api/search ───────────────────────────────────────────────────────
  //
  //  minPrice / maxPrice: parsed manually — ParseFloatPipe fails on undefined
  //  when the param is not sent, so we receive them as plain strings and
  //  convert with parseFloat() only when they are actually present.

  @Get()
  @HttpCode(HttpStatus.OK)
  async search(
    @Query('q')                                                      q?:        string,
    @Query('page',    new DefaultValuePipe(1),    ParseIntPipe)      page?:     number,
    @Query('limit',   new DefaultValuePipe(20),   ParseIntPipe)      limit?:    number,
    @Query('category')                                               category?: string,
    @Query('brand')                                                  brand?:    string,
    @Query('minPrice')                                               minPrice?: string,
    @Query('maxPrice')                                               maxPrice?: string,
    @Query('inStock',  new DefaultValuePipe(false), ParseBoolPipe)   inStock?:  boolean,
    @Query('featured', new DefaultValuePipe(false), ParseBoolPipe)   featured?: boolean,
    @Query('onSale',   new DefaultValuePipe(false), ParseBoolPipe)   onSale?:   boolean,
    @Query('sort')                                                   sort?:     string,
  ) {
    return this.searchService.search({
      q,
      page,
      limit,
      category,
      brand,
      minPrice: minPrice !== undefined ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice !== undefined ? parseFloat(maxPrice) : undefined,
      inStock,
      featured,
      onSale,
      sort,
    });
  }

  // ── GET /api/search/suggestions ───────────────────────────────────────────

  @Get('suggestions')
  @HttpCode(HttpStatus.OK)
  async suggestions(
    @Query('q')                                             q:      string,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe)  limit?: number,
  ) {
    return this.searchService.getSuggestions(q, limit);
  }
}
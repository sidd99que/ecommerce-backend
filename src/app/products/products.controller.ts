import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from '../../common/dto/create-product.dto';
import { UpdateProductDto } from '../../common/dto/update-product.dto';
import { Public } from '@common/decorator/public.decorator';
import { Roles } from '@common/decorator/roles.decorator';
import { ProductDescriptionService } from '@/services/product-description.service';
import { GenerateContentDto } from '../../common/dto/generate-content.dto';
import { SearchProductsDto } from '../../common/dto/search-products.dto';
import { SearchService } from '../search/search.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productDescriptionService: ProductDescriptionService,
     private readonly searchService: SearchService
  ) {}

  // ======================================================
  // 🔓 PUBLIC ROUTES (STATIC FIRST)
  // ======================================================




    @Public()
  @Get('search')
  search(@Query() searchDto: SearchProductsDto) {
    return this.searchService.search(searchDto);
  }

  // 🔥 ADD THIS FOR AUTOCOMPLETE
  @Public()
  @Get('search/suggestions')
  searchSuggestions(@Query('q') query: string) {
    return this.searchService.getSuggestions(query);
  }

  @Public()
  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.productsService.findAll(+page, +limit);
  }



  @Public()
  @Get('new-arrivals')
  findNewArrivals(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.productsService.findNewArrivals(+page, +limit);
  }

  @Public()
  @Get('discount-deals')
  findDiscountDeals(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.productsService.findDiscounted(+page, +limit);
  }

  @Public()
  @Get('featured')
  findFeatured(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.productsService.findFeatured(+page, +limit);
  }

  @Public()
  @Get('main-category/:name')
  getProductsByMainCategory(
    @Param('name') name: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.productsService.findByMainCategory(name, +page, +limit);
  }

  @Public()
  @Get('category/:categoryId')
  findBySubcategory(
    @Param('categoryId') categoryId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.productsService.findBySubcategory(categoryId, +page, +limit);
  }

  @Public()
  @Get('category/name/:name')
  getProductsBySubcategoryName(
    @Param('name') name: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.productsService.findBySubcategoryName(name, +page, +limit);
  }

  // ======================================================
  // 🤖 AI GENERATION ROUTES - MUST BE BEFORE DYNAMIC :id ROUTES
  // ======================================================

  @Roles('admin')
  @Post('ai/generate')
  async generateContent(@Body() body: GenerateContentDto) {
    try {
      const result = await this.productDescriptionService.generateProductContent(
        body.productName,
        body.features,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ======================================================
  // 🔓 DYNAMIC PUBLIC ROUTES (MUST BE AFTER STATIC ROUTES)
  // ======================================================

  @Public()
  @Get(':id/related')
  getRelatedProducts(@Param('id') id: string) {
    return this.productsService.getRelatedProducts(id);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // ======================================================
  // 🔒 ADMIN ROUTES
  // ======================================================

  @Roles('admin')
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
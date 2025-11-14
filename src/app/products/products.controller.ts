// src/modules/products/products.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from '../../common/dto/create-product.dto';
import { UpdateProductDto } from '../../common/dto/update-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorator/current-user.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // 🟢 Public: Get all products
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // 🟢 Public: Get featured products
  @Get('featured')
  findFeatured() {
    return this.productsService.findFeatured();
  }

  // 🟢 Public: Get product by ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // 🟢 Public: Get products by subcategory ID (T-Shirts, Shoes, etc.)
  @Get('category/:categoryId')
  findBySubcategory(@Param('categoryId') categoryId: string) {
    return this.productsService.findBySubcategory(categoryId);
  }

  // 🟢 Public: Get products by subcategory name
  @Get('category/name/:name')
  async getProductsBySubcategoryName(@Param('name') name: string) {
    return this.productsService.findBySubcategoryName(name);
  }

  // 🟢 Public: Get products by MAIN category name (Men, Women, Kids)
  @Get('main-category/:name')
  async getProductsByMainCategory(@Param('name') name: string) {
    return this.productsService.findByMainCategory(name);
  }

  // 🔒 Admin-only: Create new product
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // 🔒 Admin-only: Update product
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  // 🔒 Admin-only: Delete product
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
// src/modules/categories/categories.controller.ts
import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  Post, 
  Patch,
  Delete,
  UseGuards 
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from 'src/models/category.model';
import { CreateCategoryDto } from '../../common/dto/create-category.dto';
import { UpdateCategoryDto } from '../../common/dto/update-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorator/current-user.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // 🟢 Public: Get all categories
  @Get()
  async getAllCategories(): Promise<Category[]> {
    return this.categoriesService.getAllCategories();
  }

  // 🟢 Public: Get main categories only (Men, Women, Kids)
  @Get('main')
  async getMainCategories(): Promise<Category[]> {
    return this.categoriesService.getMainCategories();
  }

  // 🟢 Public: Get subcategories by parent category name (e.g., "Men")
  @Get('main/:name/subcategories')
  async getSubcategoriesByMainCategory(@Param('name') name: string): Promise<Category[]> {
    return this.categoriesService.getSubcategoriesByMainCategory(name);
  }

  // 🟢 Public: Get category by ID
  @Get(':id')
  async getCategoryById(@Param('id') id: string): Promise<Category | null> {
    return this.categoriesService.getCategoryById(id);
  }

  // 🔒 Admin-only: Create category
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async createCategory(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.createCategory(createCategoryDto);
  }

  // 🔒 Admin-only: Update category
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto
  ): Promise<Category> {
    return this.categoriesService.updateCategory(id, updateCategoryDto);
  }

  // 🔒 Admin-only: Delete category
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async deleteCategory(@Param('id') id: string): Promise<Category | null> {
    return this.categoriesService.deleteCategory(id);
  }
}
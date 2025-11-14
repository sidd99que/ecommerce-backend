// src/modules/categories/categories.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from 'src/models/category.model';
import { CreateCategoryDto } from '../../common/dto/create-category.dto';
import { UpdateCategoryDto } from '../../common/dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) 
    private categoryModel: Model<CategoryDocument>
  ) {}

  // 🟢 Create category (main or subcategory)
  async createCategory(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const newCategory = new this.categoryModel(createCategoryDto);
    return newCategory.save();
  }

  // 🟢 Get all categories (with populated parent)
  async getAllCategories(): Promise<Category[]> {
    return this.categoryModel.find().populate('parentCategory').exec();
  }

  // 🟢 Get only main categories (parentCategory is null)
  async getMainCategories(): Promise<Category[]> {
    return this.categoryModel.find({ parentCategory: null }).exec();
  }

  // 🟢 Get subcategories by main category name
  async getSubcategoriesByMainCategory(mainCategoryName: string): Promise<Category[]> {
    const mainCategory = await this.categoryModel.findOne({
      name: { $regex: new RegExp('^' + mainCategoryName + '$', 'i') },
      parentCategory: null
    });

    if (!mainCategory) {
      throw new NotFoundException(`Main category '${mainCategoryName}' not found`);
    }

    return this.categoryModel.find({ parentCategory: mainCategory._id }).exec();
  }

  // 🟢 Get category by ID
  async getCategoryById(id: string): Promise<Category | null> {
    const category = await this.categoryModel
      .findById(id)
      .populate('parentCategory')
      .exec();
    
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    
    return category;
  }

  // 🔒 Update category
  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .populate('parentCategory')
      .exec();

    if (!updatedCategory) {
      throw new NotFoundException('Category not found');
    }

    return updatedCategory;
  }

  // 🔒 Delete category
  async deleteCategory(id: string): Promise<Category | null> {
    const category = await this.categoryModel.findByIdAndDelete(id).exec();
    
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    
    return category;
  }
}
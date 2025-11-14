// src/modules/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from 'src/models/product.model';
import { Category, CategoryDocument } from 'src/models/category.model';
import { CreateProductDto } from '../../common/dto/create-product.dto';
import { UpdateProductDto } from '../../common/dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  // 🟢 Create a new product (Admin Only)
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = new this.productModel(createProductDto);
    return await product.save();
  }

  // 🟢 Get all products (Public)
  async findAll(): Promise<Product[]> {
    return await this.productModel
      .find()
      .populate({
        path: 'category',
        populate: { path: 'parentCategory' } // Populate parent category too
      })
      .exec();
  }

  // 🟢 Get featured products (Public)
  async findFeatured(): Promise<Product[]> {
    return await this.productModel
      .find({ featured: true })
      .populate({
        path: 'category',
        populate: { path: 'parentCategory' }
      })
      .exec();
  }

  // 🟢 Get single product by ID (Public)
  async findOne(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .populate({
        path: 'category',
        populate: { path: 'parentCategory' }
      })
      .exec();
    
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  // 🟢 Get products by Subcategory ID (T-Shirts, Shoes, etc.)
  async findBySubcategory(subcategoryId: string): Promise<Product[]> {
    const products = await this.productModel
      .find({ category: subcategoryId })
      .populate({
        path: 'category',
        populate: { path: 'parentCategory' }
      })
      .exec();

    if (!products || products.length === 0) {
      throw new NotFoundException('No products found for this subcategory');
    }
    return products;
  }

  // 🟢 Get products by Subcategory Name
  async findBySubcategoryName(name: string): Promise<Product[]> {
    const subcategory = await this.categoryModel.findOne({
      name: { $regex: new RegExp('^' + name + '$', 'i') },
    });

    if (!subcategory) {
      throw new NotFoundException(`Subcategory '${name}' not found`);
    }

    return this.productModel
      .find({ category: subcategory._id })
      .populate({
        path: 'category',
        populate: { path: 'parentCategory' }
      })
      .exec();
  }

  // 🟢 Get products by MAIN Category Name (Men, Women, Kids) - KEY FEATURE!
// 🟢 Get products by MAIN Category Name (Men, Women, Kids)
async findByMainCategory(mainCategoryName: string): Promise<Product[]> {
  // 1️⃣ Find main category by name
  const mainCategory = await this.categoryModel.findOne({
    name: { $regex: new RegExp('^' + mainCategoryName + '$', 'i') },
    parentCategory: null,
  });

  if (!mainCategory) {
    throw new NotFoundException(`Main category '${mainCategoryName}' not found`);
  }

  // 2️⃣ Find subcategories (if any)
  const subcategories = await this.categoryModel.find({
    parentCategory: mainCategory._id,
  });

  // 3️⃣ Build a list of all category IDs (main + subs)
  const categoryIds = [mainCategory._id];
  if (subcategories.length > 0) {
    categoryIds.push(...subcategories.map((sub) => sub._id));
  }

  // ✅ 4️⃣ Find all products in main + subcategories
  const products = await this.productModel
    .find({ category: { $in: categoryIds } })
    .populate({
      path: 'category',
      populate: { path: 'parentCategory' },
    })
    .exec();

  if (!products || products.length === 0) {
    throw new NotFoundException(`No products found for category '${mainCategoryName}'`);
  }

  return products;
}


  // 🔒 Update Product (Admin Only)
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .populate({
        path: 'category',
        populate: { path: 'parentCategory' }
      })
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException('Product not found');
    }
    return updatedProduct;
  }

  // 🔒 Delete Product (Admin Only)
  async remove(id: string): Promise<{ message: string }> {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Product not found');
    return { message: 'Product deleted successfully' };
  }
}
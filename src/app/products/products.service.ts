// src/app/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../../models/product.model';
import { CreateProductDto } from '../../common/dto/create-product.dto';
import { UpdateProductDto } from '../../common/dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  /**
   * Create a new product
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      const product = new this.productModel(createProductDto);
      return await product.save();
    } catch (error) {
      throw new BadRequestException(`Failed to create product: ${error.message}`);
    }
  }

  /**
   * Get all products with pagination
   */
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productModel
        .find({ status: 'active' }) // ✅ Filter by active status
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.productModel.countDocuments({ status: 'active' }),
    ]);

    return {
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Get new arrivals (sorted by arrivalDate)
   */
  async findNewArrivals(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productModel
        .find({ status: 'active' })
        .sort({ arrivalDate: -1 }) // ✅ Sort by arrival date
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.productModel.countDocuments({ status: 'active' }),
    ]);

    return {
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Get discounted products
   */
  async findDiscounted(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productModel
        .find({
          status: 'active',
          isDiscounted: true,
          discountPercentage: { $gt: 0 },
        })
        .sort({ discountPercentage: -1 }) // ✅ Sort by highest discount
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.productModel.countDocuments({
        status: 'active',
        isDiscounted: true,
        discountPercentage: { $gt: 0 },
      }),
    ]);

    return {
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Get featured products
   */
  async findFeatured(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productModel
        .find({
          status: 'active',
          featured: true,
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.productModel.countDocuments({
        status: 'active',
        featured: true,
      }),
    ]);

    return {
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Get products by main category name
   */
  async findByMainCategory(name: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // ✅ Search in embedded category.name field
    const [products, total] = await Promise.all([
      this.productModel
        .find({
          status: 'active',
          'category.name': new RegExp(name, 'i'), // Case-insensitive search
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.productModel.countDocuments({
        status: 'active',
        'category.name': new RegExp(name, 'i'),
      }),
    ]);

    if (products.length === 0) {
      throw new NotFoundException(`No products found for category: ${name}`);
    }

    return {
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Get products by category ID (subcategory)
   */
  async findBySubcategory(
    categoryId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('Invalid category ID');
    }

    const skip = (page - 1) * limit;

    // ✅ Search in embedded category._id field
    const [products, total] = await Promise.all([
      this.productModel
        .find({
          status: 'active',
          'category._id': new Types.ObjectId(categoryId), // ✅ Updated to nested field
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.productModel.countDocuments({
        status: 'active',
        'category._id': new Types.ObjectId(categoryId),
      }),
    ]);

    if (products.length === 0) {
      throw new NotFoundException(
        `No products found for category ID: ${categoryId}`,
      );
    }

    return {
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Get products by subcategory name
   */
  async findBySubcategoryName(
    name: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    // ✅ Search by subCategory field
    const [products, total] = await Promise.all([
      this.productModel
        .find({
          status: 'active',
          subCategory: new RegExp(name, 'i'),
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.productModel.countDocuments({
        status: 'active',
        subCategory: new RegExp(name, 'i'),
      }),
    ]);

    if (products.length === 0) {
      throw new NotFoundException(
        `No products found for subcategory: ${name}`,
      );
    }

    return {
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Get single product by ID
   */
  async findOne(id: string): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel
      .findOne({
        _id: new Types.ObjectId(id),
        status: 'active',
      })
      .lean()
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // ✅ Increment view count for metrics
    await this.productModel.updateOne(
      { _id: new Types.ObjectId(id) },
      { $inc: { 'metrics.viewCount': 1 } },
    );

    return product;
  }

  /**
   * Get related products (same category)
   */
  async getRelatedProducts(id: string, limit: number = 6) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel
      .findOne({ _id: new Types.ObjectId(id) })
      .lean()
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // ✅ Find products in same category, exclude current product
    const relatedProducts = await this.productModel
      .find({
        status: 'active',
        'category._id': product.category._id, // ✅ Updated to nested field
        _id: { $ne: new Types.ObjectId(id) }, // Exclude current product
      })
      .limit(limit)
      .sort({ 'metrics.popularityScore': -1 }) // ✅ Sort by popularity
      .lean()
      .exec();

    return {
      success: true,
      data: relatedProducts,
    };
  }

  /**
   * Update product
   */
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, {
        new: true,
        runValidators: true,
      })
      .lean()
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return updatedProduct;
  }

  /**
   * Delete product (soft delete by setting status to archived)
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    // ✅ Soft delete - set status to archived
    const result = await this.productModel
      .findByIdAndUpdate(
        id,
        { status: 'archived' },
        { new: true },
      )
      .exec();

    if (!result) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Product archived successfully',
    };
  }

  /**
   * Hard delete product (use cautiously)
   */
  async hardDelete(id: string): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const result = await this.productModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Product permanently deleted',
    };
  }
}

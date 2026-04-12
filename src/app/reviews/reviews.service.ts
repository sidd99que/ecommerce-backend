import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../../models/review.model';
import { Product, ProductDocument } from '../../models/product.model';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  /**
   * Create a new review & update product metrics
   */
  async createReview(
    createReviewDto: CreateReviewDto,
    userId: string,
    username: string,
  ) {
    const { productId, rating, comment } = createReviewDto;

    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    // Check product exists
    const product = await this.productModel
      .findOne({ _id: new Types.ObjectId(productId), status: 'active' })
      .lean()
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check user hasn't already reviewed this product
    const existingReview = await this.reviewModel
      .findOne({
        productId: new Types.ObjectId(productId),
        userId: new Types.ObjectId(userId),
      })
      .lean()
      .exec();

    if (existingReview) {
      throw new ConflictException('You have already reviewed this product');
    }

    // Create review
    const review = new this.reviewModel({
      productId: new Types.ObjectId(productId),
      userId: new Types.ObjectId(userId),
      username,
      rating,
      comment,
    });

    await review.save();

    // Recalculate product rating & reviewCount
    await this.updateProductMetrics(productId);

    return {
      success: true,
      data: review,
      message: 'Review submitted successfully',
    };
  }

  /**
   * Get all reviews for a product with pagination
   */
  async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find({ productId: new Types.ObjectId(productId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.reviewModel.countDocuments({
        productId: new Types.ObjectId(productId),
      }),
    ]);

    // Calculate rating breakdown (1★ to 5★ counts)
    const ratingBreakdown = await this.reviewModel.aggregate([
      { $match: { productId: new Types.ObjectId(productId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingBreakdown.forEach((r) => {
      breakdown[r._id] = r.count;
    });

    return {
      success: true,
      data: reviews,
      ratingBreakdown: breakdown,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Get rating summary only (for product detail page header)
   */
  async getProductRatingSummary(productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel
      .findById(productId)
      .select('metrics.rating metrics.reviewCount')
      .lean()
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return {
      success: true,
      data: {
        rating: product.metrics?.rating ?? 0,
        reviewCount: product.metrics?.reviewCount ?? 0,
      },
    };
  }

  /**
   * Recalculate & update product rating metrics after a new review
   */
  private async updateProductMetrics(productId: string) {
    const result = await this.reviewModel.aggregate([
      { $match: { productId: new Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$productId',
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      const { avgRating, reviewCount } = result[0];
      await this.productModel.updateOne(
        { _id: new Types.ObjectId(productId) },
        {
          $set: {
            'metrics.rating': Math.round(avgRating * 10) / 10, // Round to 1 decimal
            'metrics.reviewCount': reviewCount,
          },
        },
      );
    }
  }
}
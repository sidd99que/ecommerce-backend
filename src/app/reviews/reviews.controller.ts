import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Public } from '@common/decorator/public.decorator';
import { Roles } from '@common/decorator/roles.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ======================================================
  // 🔓 PUBLIC ROUTES
  // ======================================================

  @Public()
  @Get('product/:productId')
  getProductReviews(
    @Param('productId') productId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.reviewsService.getProductReviews(productId, +page, +limit);
  }

  @Public()
  @Get('product/:productId/summary')
  getProductRatingSummary(@Param('productId') productId: string) {
    return this.reviewsService.getProductRatingSummary(productId);
  }

  // ======================================================
  // 🔒 PROTECTED ROUTES (logged in users only)
  // ======================================================

  @Post()
  createReview(@Body() createReviewDto: CreateReviewDto, @Request() req) {
    const userId = req.user._id;
    const username = req.user.username ?? req.user.name ?? 'Anonymous';
    return this.reviewsService.createReview(createReviewDto, userId, username);
  }
}
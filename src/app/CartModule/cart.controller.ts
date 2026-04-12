import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CartService } from './cart.service';
import { CreateCartItemDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import { Public } from '@common/decorator/public.decorator';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserPayload {
  userId: string;
}

// ── Controller ────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // ── POST /cart/add ────────────────────────────────────────────────────────

  @Public()
  @Post('add')
  async addItem(
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
    @Body() dto: CreateCartItemDto,
  ) {
    const userId = user?.userId ?? 'guest';
    return this.cartService.addItemToCart(userId, dto);
  }

  // ── GET /cart ─────────────────────────────────────────────────────────────

  @Public()
  @Get()
  async getCart(
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    const userId = user?.userId ?? 'guest';
    return this.cartService.getCart(userId);
  }

  // ── PATCH /cart/update/:itemId ────────────────────────────────────────────

  @Public()
  @Patch('update/:itemId')
  async updateItem(
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const userId = user?.userId ?? 'guest';
    return this.cartService.updateItem(userId, itemId, dto);
  }

  // ── DELETE /cart/remove/:itemId ───────────────────────────────────────────

  @Public()
  @Delete('remove/:itemId')
  async removeItem(
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
    @Param('itemId') itemId: string,
  ) {
    const userId = user?.userId ?? 'guest';
    return this.cartService.removeItem(userId, itemId);
  }




  @Public()
@Delete('clear')
async clearCartByPath(
  @CurrentUser() user: UserPayload,
  @Req() req: Request,
) {
  const userId = user?.userId ?? 'guest';
  return this.cartService.clearCart(userId);
}

  // ── DELETE /cart ──────────────────────────────────────────────────────────

  @Public()
  @Delete()
  async clearCart(
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    const userId = user?.userId ?? 'guest';
    return this.cartService.clearCart(userId);
  }
}
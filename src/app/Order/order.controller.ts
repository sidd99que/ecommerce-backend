// src/modules/orders/orders.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';

import { OrdersService } from './order.service';
import { Roles } from '../../common/decorator/roles.decorator';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import * as userPayloadInterface from '../../common/interfaces/user-payload.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}


  @Post()
  createOrder(
    @CurrentUser() user: userPayloadInterface.UserPayload,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(user.userId, dto);
  }


  @Get('my')
  getMyOrders(
    @CurrentUser() user: userPayloadInterface.UserPayload,
  ) {
    return this.ordersService.getUserOrders(user.userId);
  }


  @Roles('admin')
  @Get('all')
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  @Get(':orderId')
  getOrderById(
    @CurrentUser() user: userPayloadInterface.UserPayload,
    @Param('orderId') orderId: string,
  ) {
    return this.ordersService.getOrderById(user.userId, orderId);
  }

 
  // 5️⃣ UPDATE ORDER STATUS (Admin Only)
  // ─────────────────────────────────────────────
  @Roles('admin')
  @Patch(':orderId/status')
  updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.ordersService.updateOrderStatus(orderId, dto);
  }

  @Roles('admin')
  @Delete(':orderId')
  deleteOrder(
    @Param('orderId') orderId: string,
  ) {
    return this.ordersService.deleteOrder(orderId);
  }
}

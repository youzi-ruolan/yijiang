import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('api')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('home')
  getHome() {
    return this.publicService.getHome();
  }

  @Get('categories')
  getCategories() {
    return this.publicService.getCategories();
  }

  @Get('products')
  getProducts(@Query('category') category?: string) {
    return this.publicService.getProducts(category);
  }

  @Get('products/:id')
  getProductDetail(@Param('id') id: string) {
    return this.publicService.getProductDetail(id);
  }

  @Get('orders')
  getOrders(@Query('status') status?: string) {
    return this.publicService.getOrders(status);
  }

  @Get('orders/count')
  getOrdersCount() {
    return this.publicService.getOrdersCount();
  }

  @Post('orders/settle')
  getOrderSettle(@Body() payload: Record<string, unknown>) {
    return this.publicService.getOrderSettle(payload);
  }

  @Get('orders/:id')
  getOrderDetail(@Param('id') id: string) {
    return this.publicService.getOrderDetail(id);
  }

  @Post('orders')
  createOrder(@Body() payload: Record<string, unknown>) {
    return this.publicService.createOrder(payload);
  }
}

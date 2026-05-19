import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('api')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('home')
  getHome() {
    return this.publicService.getHome();
  }

  @Post('auth/login')
  login(@Body() payload: Record<string, unknown>) {
    return this.publicService.login(payload);
  }

  @Get('usercenter')
  getUserCenter(@Query('uid') uid?: string) {
    return this.publicService.getUserCenter(uid);
  }

  @Get('person')
  getPerson(@Query('uid') uid?: string) {
    return this.publicService.getPerson(uid);
  }

  @Post('person/profile')
  updatePersonProfile(@Body() payload: Record<string, unknown>) {
    return this.publicService.updatePersonProfile(payload);
  }

  @Get('addresses')
  getAddresses(@Query('uid') uid?: string) {
    return this.publicService.getAddresses(uid);
  }

  @Get('addresses/default')
  getDefaultAddress(@Query('uid') uid?: string) {
    return this.publicService.getDefaultAddress(uid);
  }

  @Get('addresses/:id')
  getAddressDetail(@Param('id') id: string, @Query('uid') uid?: string) {
    return this.publicService.getAddressDetail(id, uid);
  }

  @Post('addresses')
  createAddress(@Body() payload: Record<string, unknown>) {
    return this.publicService.createAddress(payload);
  }

  @Put('addresses/:id')
  updateAddress(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    return this.publicService.updateAddress(id, payload);
  }

  @Delete('addresses/:id')
  deleteAddress(@Param('id') id: string, @Query('uid') uid?: string) {
    return this.publicService.deleteAddress(id, uid);
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
  getOrders(@Query('status') status?: string, @Query('uid') uid?: string) {
    return this.publicService.getOrders(status, uid);
  }

  @Get('orders/count')
  getOrdersCount(@Query('uid') uid?: string) {
    return this.publicService.getOrdersCount(uid);
  }

  @Post('orders/settle')
  getOrderSettle(@Body() payload: Record<string, unknown>) {
    return this.publicService.getOrderSettle(payload);
  }

  @Get('orders/:id')
  getOrderDetail(@Param('id') id: string, @Query('uid') uid?: string) {
    return this.publicService.getOrderDetail(id, uid);
  }

  @Post('orders')
  createOrder(@Body() payload: Record<string, unknown>) {
    return this.publicService.createOrder(payload);
  }
}

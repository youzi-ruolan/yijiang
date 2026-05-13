import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.order.findMany({
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
    });
  }

  create(payload: CreateOrderDto) {
    return this.prisma.order.create({
      data: {
        id: payload.id,
        customer: payload.customer,
        amount: payload.amount,
        status: payload.status,
        items: payload.items,
        itemsDetail: this.toPrismaJson(payload.itemsDetail),
        orderCreatedAt: payload.createdAt,
      },
    });
  }

  update(id: string, payload: UpdateOrderDto) {
    return this.prisma.order.update({
      where: { id },
      data: {
        customer: payload.customer,
        amount: payload.amount,
        status: payload.status,
        items: payload.items,
        itemsDetail: payload.itemsDetail === undefined ? undefined : this.toPrismaJson(payload.itemsDetail),
        orderCreatedAt: payload.createdAt,
      },
    });
  }

  remove(id: string) {
    return this.prisma.order.delete({
      where: { id },
    });
  }

  private toPrismaJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    return value == null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
  }
}

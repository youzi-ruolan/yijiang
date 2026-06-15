import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  getAdminNextStatuses,
  getOrderItems,
  getOrderStatusName,
  normalizeOrderStatus,
  ORDER_STATUS,
} from '../../common/order-status';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

type OrderRecord = {
  id: string;
  userId: string | null;
  customer: string;
  amount: number;
  status: string;
  items: number;
  itemsDetail: unknown;
  orderCreatedAt: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const orders = await this.prisma.order.findMany({
      orderBy: [{ createdAt: 'desc' }],
    });
    return orders.map((order) => this.formatAdminOrder(order));
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });
    return order ? this.formatAdminOrder(order) : null;
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
    const data: Prisma.OrderUpdateInput = {};

    if (payload.customer !== undefined) data.customer = payload.customer;
    if (payload.amount !== undefined) data.amount = payload.amount;
    if (payload.status !== undefined) data.status = payload.status;
    if (payload.items !== undefined) data.items = payload.items;
    if (payload.createdAt !== undefined) data.orderCreatedAt = payload.createdAt;
    if (payload.itemsDetail !== undefined) {
      data.itemsDetail = this.toPrismaJson(payload.itemsDetail);
    }

    return this.prisma.order
      .update({
        where: { id },
        data,
      })
      .then((order) => this.formatAdminOrder(order));
  }

  async updateStatus(id: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new BadRequestException('订单不存在');
    }

    const normalizedStatus = normalizeOrderStatus(status);
    if (!normalizedStatus) {
      throw new BadRequestException('无效的订单状态');
    }

    const allowedStatuses = getAdminNextStatuses(order.status);
    if (!allowedStatuses.includes(normalizedStatus)) {
      throw new BadRequestException('当前订单状态不允许此操作');
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: normalizedStatus },
    });

    return this.formatAdminOrder(updated);
  }

  remove(id: string) {
    return this.prisma.order.delete({
      where: { id },
    });
  }

  private formatAdminOrder(order: OrderRecord) {
    const status = normalizeOrderStatus(order.status) || order.status;

    return {
      id: order.id,
      userId: order.userId,
      customer: order.customer,
      amount: order.amount,
      status,
      statusName: getOrderStatusName(order.status),
      items: order.items,
      itemsDetail: getOrderItems(order.itemsDetail).map((item) => ({
        spuId: `${item.spuId || ''}`,
        skuId: `${item.skuId || ''}`,
        goodsName: `${item.goodsName || '商品'}`,
        goodsPictureUrl: `${item.goodsPictureUrl || ''}`,
        buyQuantity: Number(item.buyQuantity || 1),
        actualPrice: Number(item.actualPrice || item.tagPrice || 0),
        tagPrice: Number(item.tagPrice || item.actualPrice || 0),
      })),
      orderCreatedAt: order.orderCreatedAt,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      nextStatuses: getAdminNextStatuses(order.status).map((value) => ({
        value,
        label: getOrderStatusName(value),
      })),
      isPaid: status !== ORDER_STATUS.PENDING_PAYMENT && status !== ORDER_STATUS.CANCELED,
    };
  }

  private toPrismaJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    return value == null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
  }
}

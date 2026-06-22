import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string) {
    const products = await this.prisma.product.findMany({
      where: category && category !== 'all' ? { category } : undefined,
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });

    return products.map((product) => this.serializeProduct(product));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    return product ? this.serializeProduct(product) : null;
  }

  create(payload: CreateProductDto) {
    return this.prisma.product
      .create({
        data: this.toCreateInput(payload),
      })
      .then((product) => this.serializeProduct(product));
  }

  update(id: string, payload: UpdateProductDto) {
    return this.prisma.product
      .update({
        where: { id },
        data: this.toUpdateInput(payload),
      })
      .then((product) => this.serializeProduct(product));
  }

  remove(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }

  private toCreateInput(payload: CreateProductDto): Prisma.ProductUncheckedCreateInput {
    return {
      id: payload.id,
      title: payload.title,
      description: payload.description,
      price: this.normalizePrice(payload.price),
      sales: payload.sales ?? 0,
      cover: payload.cover,
      tags: payload.tags ?? [],
      bannerImages: payload.bannerImages ?? [],
      gallery: payload.gallery ?? [],
      detailContent: this.normalizeDetailContentInput(payload.detailContent),
      deliverables: payload.deliverables ?? [],
      usageNotice: payload.usageNotice ?? [],
      category: payload.category,
      isNew: payload.isNew ?? false,
      isHot: payload.isHot ?? false,
      sort: payload.sort ?? 0,
      status: payload.status ?? 'ACTIVE',
    };
  }

  private toUpdateInput(payload: UpdateProductDto): Prisma.ProductUncheckedUpdateInput {
    return {
      ...(payload.id ? { id: payload.id } : {}),
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.price !== undefined ? { price: this.normalizePrice(payload.price) } : {}),
      ...(payload.sales !== undefined ? { sales: payload.sales } : {}),
      ...(payload.cover !== undefined ? { cover: payload.cover } : {}),
      ...(payload.tags !== undefined ? { tags: payload.tags } : {}),
      ...(payload.bannerImages !== undefined ? { bannerImages: payload.bannerImages } : {}),
      ...(payload.gallery !== undefined ? { gallery: payload.gallery } : {}),
      ...(payload.detailContent !== undefined
        ? { detailContent: this.normalizeDetailContentInput(payload.detailContent) }
        : {}),
      ...(payload.deliverables !== undefined ? { deliverables: payload.deliverables } : {}),
      ...(payload.usageNotice !== undefined ? { usageNotice: payload.usageNotice } : {}),
      ...(payload.category !== undefined ? { category: payload.category } : {}),
      ...(payload.isNew !== undefined ? { isNew: payload.isNew } : {}),
      ...(payload.isHot !== undefined ? { isHot: payload.isHot } : {}),
      ...(payload.sort !== undefined ? { sort: payload.sort } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
    };
  }

  private normalizeDetailContentInput(value: string | string[] | undefined) {
    if (value === undefined) return [];
    if (typeof value === 'string') return value.trim();
    return value.map((item) => `${item}`.trim()).filter(Boolean);
  }

  private normalizePrice(price: number) {
    return Math.round(Number(price) * 100) / 100;
  }

  private serializeProduct(product: Product) {
    return {
      ...product,
      price: Number(product.price),
    };
  }
}

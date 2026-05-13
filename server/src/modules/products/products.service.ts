import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(category?: string) {
    return this.prisma.product.findMany({
      where: category && category !== 'all' ? { category } : undefined,
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });
  }

  findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  create(payload: CreateProductDto) {
    return this.prisma.product.create({
      data: this.toCreateInput(payload),
    });
  }

  update(id: string, payload: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: this.toUpdateInput(payload),
    });
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
      price: payload.price,
      originalPrice: payload.originalPrice,
      rating: payload.rating ?? 5,
      sales: payload.sales ?? 0,
      favorites: payload.favorites ?? 0,
      cover: payload.cover,
      tags: payload.tags ?? [],
      gallery: payload.gallery ?? [],
      detailContent: payload.detailContent ?? [],
      deliverables: payload.deliverables ?? [],
      usageNotice: payload.usageNotice ?? [],
      format: payload.format ?? '',
      accent: payload.accent ?? '',
      category: payload.category,
      authorName: payload.author?.name ?? '',
      authorAvatar: payload.author?.avatar ?? '',
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
      ...(payload.price !== undefined ? { price: payload.price } : {}),
      ...(payload.originalPrice !== undefined ? { originalPrice: payload.originalPrice } : {}),
      ...(payload.rating !== undefined ? { rating: payload.rating } : {}),
      ...(payload.sales !== undefined ? { sales: payload.sales } : {}),
      ...(payload.favorites !== undefined ? { favorites: payload.favorites } : {}),
      ...(payload.cover !== undefined ? { cover: payload.cover } : {}),
      ...(payload.tags !== undefined ? { tags: payload.tags } : {}),
      ...(payload.gallery !== undefined ? { gallery: payload.gallery } : {}),
      ...(payload.detailContent !== undefined ? { detailContent: payload.detailContent } : {}),
      ...(payload.deliverables !== undefined ? { deliverables: payload.deliverables } : {}),
      ...(payload.usageNotice !== undefined ? { usageNotice: payload.usageNotice } : {}),
      ...(payload.format !== undefined ? { format: payload.format } : {}),
      ...(payload.accent !== undefined ? { accent: payload.accent } : {}),
      ...(payload.category !== undefined ? { category: payload.category } : {}),
      ...(payload.author !== undefined ? { authorName: payload.author?.name ?? '', authorAvatar: payload.author?.avatar ?? '' } : {}),
      ...(payload.isNew !== undefined ? { isNew: payload.isNew } : {}),
      ...(payload.isHot !== undefined ? { isHot: payload.isHot } : {}),
      ...(payload.sort !== undefined ? { sort: payload.sort } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
    };
  }
}

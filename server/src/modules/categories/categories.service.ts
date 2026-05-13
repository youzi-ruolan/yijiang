import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });
  }

  create(payload: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        ...payload,
        sort: payload.sort ?? 0,
        status: payload.status ?? 'ACTIVE',
      },
    });
  }

  update(id: string, payload: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: payload,
    });
  }

  remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const category = await tx.category.findUnique({
        where: { id },
      });

      if (!category) {
        return null;
      }

      if (category.filterKey !== 'all' && category.target === 'productSection') {
        const fallbackCategory =
          (
            await tx.category.findFirst({
              where: {
                target: 'productSection',
                id: { not: id },
                filterKey: { not: 'all' },
              },
              orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
            })
          )?.filterKey || 'all';

        await tx.product.updateMany({
          where: { category: category.filterKey },
          data: { category: fallbackCategory },
        });
      }

      return tx.category.delete({
        where: { id },
      });
    });
  }
}

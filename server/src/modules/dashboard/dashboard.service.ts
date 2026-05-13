import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [products, categories, banners, inspirations, articles, orders] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.category.count(),
      this.prisma.banner.count(),
      this.prisma.inspiration.count(),
      this.prisma.article.count(),
      this.prisma.order.count(),
    ]);

    return {
      products,
      categories,
      content: banners + inspirations + articles,
      orders,
    };
  }
}

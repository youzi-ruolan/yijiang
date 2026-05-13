import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { CreateBannerDto } from './dto/create-banner.dto';
import { CreateInspirationDto } from './dto/create-inspiration.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { UpdateInspirationDto } from './dto/update-inspiration.dto';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  getBanners() {
    return this.prisma.banner.findMany({ orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }] });
  }

  createBanner(payload: CreateBannerDto) {
    return this.prisma.banner.create({ data: payload });
  }

  updateBanner(id: string, payload: UpdateBannerDto) {
    return this.prisma.banner.update({ where: { id }, data: payload });
  }

  removeBanner(id: string) {
    return this.prisma.banner.delete({ where: { id } });
  }

  getInspirations() {
    return this.prisma.inspiration.findMany({ orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }] });
  }

  createInspiration(payload: CreateInspirationDto) {
    return this.prisma.inspiration.create({ data: payload });
  }

  updateInspiration(id: string, payload: UpdateInspirationDto) {
    return this.prisma.inspiration.update({ where: { id }, data: payload });
  }

  removeInspiration(id: string) {
    return this.prisma.inspiration.delete({ where: { id } });
  }

  getArticles() {
    return this.prisma.article.findMany({ orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }] });
  }

  createArticle(payload: CreateArticleDto) {
    return this.prisma.article.create({ data: payload });
  }

  updateArticle(id: string, payload: UpdateArticleDto) {
    return this.prisma.article.update({ where: { id }, data: payload });
  }

  removeArticle(id: string) {
    return this.prisma.article.delete({ where: { id } });
  }
}

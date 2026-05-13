import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ContentService } from './content.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { CreateBannerDto } from './dto/create-banner.dto';
import { CreateInspirationDto } from './dto/create-inspiration.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { UpdateInspirationDto } from './dto/update-inspiration.dto';

@Controller('admin/content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('banners')
  getBanners() {
    return this.contentService.getBanners();
  }

  @Post('banners')
  createBanner(@Body() payload: CreateBannerDto) {
    return this.contentService.createBanner(payload);
  }

  @Put('banners/:id')
  updateBanner(@Param('id') id: string, @Body() payload: UpdateBannerDto) {
    return this.contentService.updateBanner(id, payload);
  }

  @Delete('banners/:id')
  removeBanner(@Param('id') id: string) {
    return this.contentService.removeBanner(id);
  }

  @Get('inspirations')
  getInspirations() {
    return this.contentService.getInspirations();
  }

  @Post('inspirations')
  createInspiration(@Body() payload: CreateInspirationDto) {
    return this.contentService.createInspiration(payload);
  }

  @Put('inspirations/:id')
  updateInspiration(@Param('id') id: string, @Body() payload: UpdateInspirationDto) {
    return this.contentService.updateInspiration(id, payload);
  }

  @Delete('inspirations/:id')
  removeInspiration(@Param('id') id: string) {
    return this.contentService.removeInspiration(id);
  }

  @Get('articles')
  getArticles() {
    return this.contentService.getArticles();
  }

  @Post('articles')
  createArticle(@Body() payload: CreateArticleDto) {
    return this.contentService.createArticle(payload);
  }

  @Put('articles/:id')
  updateArticle(@Param('id') id: string, @Body() payload: UpdateArticleDto) {
    return this.contentService.updateArticle(id, payload);
  }

  @Delete('articles/:id')
  removeArticle(@Param('id') id: string) {
    return this.contentService.removeArticle(id);
  }
}

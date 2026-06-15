import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { CreateUploadSignatureDto } from './dto/create-upload-signature.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import type { UploadSignatureResult } from './assets.service';

@Controller('admin/assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  findAll(@Query('type') type?: string) {
    return this.assetsService.findAll(type);
  }

  @Post()
  create(@Body() payload: CreateAssetDto) {
    return this.assetsService.create(payload);
  }

  @Post('upload-signature')
  createUploadSignature(@Body() payload: CreateUploadSignatureDto): UploadSignatureResult {
    return this.assetsService.createUploadSignature(payload);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 500 * 1024 * 1024 },
    }),
  )
  upload(@UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    return this.assetsService.uploadFile(file);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() payload: UpdateAssetDto) {
    return this.assetsService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }
}

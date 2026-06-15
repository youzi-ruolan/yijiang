import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { extname } from 'path';
import { tmpdir } from 'os';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { CreateUploadSignatureDto } from './dto/create-upload-signature.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import type { UploadSignatureResult } from './assets.service';

function decodeUploadedFileName(name: string) {
  try {
    return Buffer.from(name, 'latin1').toString('utf8');
  } catch {
    return name;
  }
}

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
      storage: diskStorage({
        destination: tmpdir(),
        filename: (_req, file, callback) => {
          const extension = extname(file.originalname || '') || '.bin';
          callback(null, `asset-${Date.now()}-${randomBytes(8).toString('hex')}${extension}`);
        },
      }),
    }),
  )
  upload(
    @UploadedFile()
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      path: string;
    },
  ) {
    if (file?.originalname) {
      file.originalname = decodeUploadedFileName(file.originalname);
    }
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

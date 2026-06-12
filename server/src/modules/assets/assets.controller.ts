import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { CreateUploadSignatureDto } from './dto/create-upload-signature.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

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
  createUploadSignature(@Body() payload: CreateUploadSignatureDto) {
    return this.assetsService.createUploadSignature(payload);
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

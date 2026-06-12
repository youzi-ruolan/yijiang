import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, createHmac, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { CreateUploadSignatureDto } from './dto/create-upload-signature.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  findAll(type?: string) {
    return this.prisma.asset.findMany({
      where: type && type !== 'all' ? { type } : undefined,
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });
  }

  create(payload: CreateAssetDto) {
    return this.prisma.asset.create({
      data: this.toCreateInput(payload),
    });
  }

  update(id: string, payload: UpdateAssetDto) {
    return this.prisma.asset.update({
      where: { id },
      data: this.toUpdateInput(payload),
    });
  }

  remove(id: string) {
    return this.prisma.asset.delete({
      where: { id },
    });
  }

  createUploadSignature(payload: CreateUploadSignatureDto) {
    const secretId = this.configService.get<string>('TENCENT_COS_SECRET_ID');
    const secretKey = this.configService.get<string>('TENCENT_COS_SECRET_KEY');
    const bucket = this.configService.get<string>('TENCENT_COS_BUCKET');
    const region = this.configService.get<string>('TENCENT_COS_REGION');
    const publicBaseUrl = this.configService.get<string>('TENCENT_COS_PUBLIC_BASE_URL');

    if (!secretId || !secretKey || !bucket || !region || !publicBaseUrl) {
      throw new BadRequestException('COS 上传配置不完整，请检查服务端环境变量');
    }

    const objectKey = this.createObjectKey(payload.fileName, payload.type);
    const host = `${bucket}.cos.${region}.myqcloud.com`;
    const pathname = `/${objectKey}`;
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 600;
    const keyTime = `${now};${expiresAt}`;
    const httpMethod = 'put';
    const headerList = 'content-type;host';
    const contentType = payload.mimeType || this.getDefaultContentType(payload.type);
    const headers = {
      'content-type': encodeURIComponent(contentType).toLowerCase(),
      host: encodeURIComponent(host).toLowerCase(),
    };
    const formatHeaders = Object.keys(headers)
      .sort()
      .map((key) => `${key}=${headers[key as keyof typeof headers]}`)
      .join('&');
    const httpString = `${httpMethod}\n${pathname}\n\n${formatHeaders}\n`;
    const stringToSign = `sha1\n${keyTime}\n${this.sha1(httpString)}\n`;
    const signKey = this.hmacSha1(secretKey, keyTime);
    const signature = this.hmacSha1(signKey, stringToSign);
    const authorization = [
      'q-sign-algorithm=sha1',
      `q-ak=${secretId}`,
      `q-sign-time=${keyTime}`,
      `q-key-time=${keyTime}`,
      `q-header-list=${headerList}`,
      'q-url-param-list=',
      `q-signature=${signature}`,
    ].join('&');

    return {
      key: objectKey,
      uploadUrl: `https://${host}${pathname}`,
      publicUrl: `${publicBaseUrl.replace(/\/$/, '')}/${objectKey}`,
      authorization,
      contentType,
      expiresAt,
    };
  }

  private toCreateInput(payload: CreateAssetDto): Prisma.AssetUncheckedCreateInput {
    return {
      id: payload.id,
      name: payload.name,
      type: payload.type,
      url: payload.url,
      cover: payload.cover || null,
      description: payload.description || null,
      tags: payload.tags ?? [],
      sort: payload.sort ?? 0,
      status: payload.status ?? 'ACTIVE',
    };
  }

  private toUpdateInput(payload: UpdateAssetDto): Prisma.AssetUncheckedUpdateInput {
    return {
      ...(payload.id ? { id: payload.id } : {}),
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.type !== undefined ? { type: payload.type } : {}),
      ...(payload.url !== undefined ? { url: payload.url } : {}),
      ...(payload.cover !== undefined ? { cover: payload.cover || null } : {}),
      ...(payload.description !== undefined ? { description: payload.description || null } : {}),
      ...(payload.tags !== undefined ? { tags: payload.tags } : {}),
      ...(payload.sort !== undefined ? { sort: payload.sort } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
    };
  }

  private createObjectKey(fileName: string, type: 'image' | 'video') {
    const extension = this.getSafeExtension(fileName, type);
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    const random = randomBytes(6).toString('hex');

    return `products/${type}s/${year}/${month}/${day}/${Date.now()}-${random}.${extension}`;
  }

  private getSafeExtension(fileName: string, type: 'image' | 'video') {
    const extension = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const videoExtensions = ['mp4', 'mov', 'm4v', 'webm'];
    const allowedExtensions = type === 'image' ? imageExtensions : videoExtensions;

    if (!allowedExtensions.includes(extension)) {
      throw new BadRequestException(type === 'image' ? '仅支持 jpg/jpeg/png/webp/gif 图片' : '仅支持 mp4/mov/m4v/webm 视频');
    }

    return extension;
  }

  private getDefaultContentType(type: 'image' | 'video') {
    return type === 'image' ? 'image/jpeg' : 'video/mp4';
  }

  private sha1(value: string) {
    return createHash('sha1').update(value).digest('hex');
  }

  private hmacSha1(key: string, value: string) {
    return createHmac('sha1', key).update(value).digest('hex');
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, createHmac, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import COS from 'cos-nodejs-sdk-v5';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { CreateUploadSignatureDto } from './dto/create-upload-signature.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

interface UploadSignatureResult {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  authorization: string;
  contentType: string;
  expiresAt: number;
}

export type { UploadSignatureResult };

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
    const contentType = payload.mimeType || this.getDefaultContentType(payload.type);
    return this.buildUploadSignature(payload.fileName, payload.type, contentType);
  }

  async uploadFile(file: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    const type = this.resolveUploadType(file);
    this.validateUploadSize(file.size, type);

    const { bucket, region, publicBaseUrl } = this.getCosConfig();
    const objectKey = this.createObjectKey(file.originalname, type);
    const contentType = this.resolveContentType(file, type);
    const cos = this.getCosClient();

    try {
      await cos.putObject({
        Bucket: bucket,
        Region: region,
        Key: objectKey,
        Body: file.buffer,
        ContentType: contentType,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'COS 上传失败';
      throw new BadRequestException(message);
    }

    const publicUrl = `${publicBaseUrl.replace(/\/$/, '')}/${objectKey}`;

    return this.create({
      id: `asset_${Date.now()}_${randomBytes(3).toString('hex')}`,
      name: this.getFileNameWithoutExtension(file.originalname),
      type,
      url: publicUrl,
      cover: '',
      description: `上传文件：${file.originalname}`,
      tags: [],
      sort: 0,
      status: 'ACTIVE',
    });
  }

  private getCosClient() {
    const { secretId, secretKey } = this.getCosConfig();
    return new COS({
      SecretId: secretId,
      SecretKey: secretKey,
    });
  }

  private getCosConfig() {
    const secretId = this.configService.get<string>('TENCENT_COS_SECRET_ID');
    const secretKey = this.configService.get<string>('TENCENT_COS_SECRET_KEY');
    const bucket = this.configService.get<string>('TENCENT_COS_BUCKET');
    const region = this.configService.get<string>('TENCENT_COS_REGION');
    const publicBaseUrl = this.configService.get<string>('TENCENT_COS_PUBLIC_BASE_URL');

    if (!secretId || !secretKey || !bucket || !region || !publicBaseUrl) {
      throw new BadRequestException('COS 上传配置不完整，请检查服务端环境变量');
    }

    return {
      secretId: secretId.trim(),
      secretKey: secretKey.trim(),
      bucket: bucket.trim(),
      region: region.trim(),
      publicBaseUrl: publicBaseUrl.trim(),
    };
  }

  private resolveContentType(file: { originalname: string; mimetype: string }, type: 'image' | 'video') {
    const extension = file.originalname.split('.').pop()?.toLowerCase() || '';
    const contentTypeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      m4v: 'video/mp4',
      webm: 'video/webm',
    };

    if (file.mimetype && file.mimetype !== 'application/octet-stream') {
      return file.mimetype;
    }

    return contentTypeMap[extension] || this.getDefaultContentType(type);
  }

  private resolveUploadType(file: { originalname: string; mimetype: string }): 'image' | 'video' {
    if (file.mimetype?.startsWith('image/')) return 'image';
    if (file.mimetype?.startsWith('video/')) return 'video';

    const extension = file.originalname.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) return 'image';
    if (['mp4', 'mov', 'm4v', 'webm'].includes(extension)) return 'video';

    throw new BadRequestException('仅支持图片 jpg/jpeg/png/webp/gif 或视频 mp4/mov/m4v/webm');
  }

  private validateUploadSize(size: number, type: 'image' | 'video') {
    const maxImageSize = 20 * 1024 * 1024;
    const maxVideoSize = 500 * 1024 * 1024;

    if (type === 'image' && size > maxImageSize) {
      throw new BadRequestException('图片不能超过 20MB');
    }

    if (type === 'video' && size > maxVideoSize) {
      throw new BadRequestException('视频不能超过 500MB');
    }
  }

  private getFileNameWithoutExtension(fileName: string) {
    return fileName.replace(/\.[^.]+$/, '');
  }

  private buildUploadSignature(fileName: string, type: 'image' | 'video', contentType: string): UploadSignatureResult {
    const { secretId, secretKey, bucket, region, publicBaseUrl } = this.getCosConfig();
    const objectKey = this.createObjectKey(fileName, type);
    const host = `${bucket}.cos.${region}.myqcloud.com`;
    const pathname = `/${objectKey}`;
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 600;
    const keyTime = `${now};${expiresAt}`;
    const httpMethod = 'put';
    const headerList = 'content-type;host';
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

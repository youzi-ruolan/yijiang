import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateUploadSignatureDto {
  @IsString()
  fileName!: string;

  @IsIn(['image', 'video'])
  type!: 'image' | 'video';

  @IsOptional()
  @IsString()
  mimeType?: string;
}

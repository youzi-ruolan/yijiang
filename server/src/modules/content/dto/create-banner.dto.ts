import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  id!: string;

  @IsString()
  title!: string;

  @IsString()
  subtitle!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  image!: string;

  @IsOptional()
  @IsString()
  buttonText?: string;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

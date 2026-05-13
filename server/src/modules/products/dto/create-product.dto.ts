import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  id!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsNumber()
  price!: number;

  @IsNumber()
  originalPrice!: number;

  @IsNumber()
  rating!: number;

  @IsNumber()
  sales!: number;

  @IsNumber()
  favorites!: number;

  @IsString()
  cover!: string;

  @IsArray()
  tags!: string[];

  @IsArray()
  gallery!: string[];

  @IsArray()
  detailContent!: string[];

  @IsArray()
  deliverables!: string[];

  @IsArray()
  usageNotice!: string[];

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  accent?: string;

  @IsOptional()
  @IsObject()
  author?: {
    name: string;
    avatar?: string;
  };

  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @IsOptional()
  @IsBoolean()
  isHot?: boolean;

  @IsOptional()
  @IsNumber()
  sort?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

import { Allow, IsArray, IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  id!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsNumber()
  sales!: number;

  @IsString()
  cover!: string;

  @IsArray()
  tags!: string[];

  @IsArray()
  gallery!: string[];

  @IsOptional()
  @IsArray()
  bannerImages?: string[];

  @IsOptional()
  @Allow()
  detailContent!: string | string[];

  @IsArray()
  deliverables!: string[];

  @IsArray()
  usageNotice!: string[];

  @IsString()
  category!: string;

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

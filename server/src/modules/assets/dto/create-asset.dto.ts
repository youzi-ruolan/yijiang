import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateAssetDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  type!: string;

  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  tags!: string[];

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

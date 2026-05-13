import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  filterKey!: string;

  @IsString()
  target!: string;

  @IsOptional()
  @IsNumber()
  sort?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

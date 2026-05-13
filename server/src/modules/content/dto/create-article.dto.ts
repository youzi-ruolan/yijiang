import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  id!: string;

  @IsString()
  title!: string;

  @IsString()
  cover!: string;

  @IsInt()
  views!: number;

  @IsString()
  author!: string;

  @IsString()
  publishTime!: string;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

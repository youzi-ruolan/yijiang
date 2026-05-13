import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateInspirationDto {
  @IsString()
  id!: string;

  @IsString()
  title!: string;

  @IsString()
  subtitle!: string;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsString()
  cover!: string;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  id!: string;

  @IsString()
  customer!: string;

  @IsInt()
  amount!: number;

  @IsString()
  status!: string;

  @IsInt()
  items!: number;

  @IsString()
  createdAt!: string;

  @IsOptional()
  itemsDetail?: unknown;
}

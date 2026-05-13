import { IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  appName!: string;

  @IsString()
  appSlogan!: string;

  @IsString()
  headlineTitle!: string;

  @IsString()
  headlineSubtitle!: string;
}

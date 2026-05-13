import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  getSettings() {
    return this.prisma.appSetting.findUnique({
      where: { id: 'default' },
    });
  }

  updateSettings(payload: UpdateSettingsDto) {
    return this.prisma.appSetting.upsert({
      where: { id: 'default' },
      update: payload,
      create: {
        id: 'default',
        ...payload,
      },
    });
  }
}

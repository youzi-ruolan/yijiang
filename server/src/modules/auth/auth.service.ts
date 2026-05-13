import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService, private readonly prisma: PrismaService) {}

  async login(payload: LoginDto) {
    const username = payload.username.trim();
    const password = payload.password.trim();
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { username },
    });

    if (!adminUser || adminUser.password !== password) {
      throw new UnauthorizedException('账号或密码错误');
    }

    return {
      token: `demo-token-${Date.now()}`,
      user: {
        username: adminUser.username,
        displayName: adminUser.displayName,
        role: adminUser.role,
        avatar: adminUser.avatar,
      },
      expiresIn: 7 * 24 * 60 * 60,
      secretConfigured: Boolean(this.configService.get('JWT_SECRET')),
    };
  }
}

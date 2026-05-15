import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function resolveCorsOrigin(configService: ConfigService) {
  const origin = configService.get<string>('CORS_ORIGIN');

  if (!origin) {
    return true;
  }

  const originList = origin
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return originList.length ? originList : true;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('');
  app.enableCors({
    origin: resolveCorsOrigin(configService),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);
}

bootstrap();

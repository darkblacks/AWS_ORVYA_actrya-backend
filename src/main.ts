import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { isAbsolute, join } from 'path';
import { mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  const corsSetting = config.get<string>('CORS_ORIGIN', '*');
  app.enableCors(corsSetting === '*'
    ? { origin: true, credentials: false }
    : { origin: corsSetting.split(',').map((v) => v.trim()), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

  const uploadDir = config.get<string>('UPLOAD_DIR', 'uploads');
  const uploadPath = isAbsolute(uploadDir) ? uploadDir : join(process.cwd(), uploadDir);
  mkdirSync(uploadPath, { recursive: true });
  app.useStaticAssets(uploadPath, { prefix: '/uploads/' });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Actrya API')
    .setDescription('API do Actrya: projetos configuráveis, layouts, Kanbans hierárquicos, cards dinâmicos e auditoria.')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(config.get<number>('PORT', 3000), '0.0.0.0');
}

void bootstrap();

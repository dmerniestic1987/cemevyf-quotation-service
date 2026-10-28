import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
const { port, logLevel, swagger, cors, trustProxy } = require('config');
import { FeatureEnum } from './commons/types/feature.enum';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: [logLevel],
  });
  // Needed to see the real client IP (login rate limit and logs) when the service runs behind a proxy
  app.set('trust proxy', trustProxy);
  const options = new DocumentBuilder()
    .setTitle('CEMEVYF Health Orders Service')
    .setDescription('A service to provide basic management of Health Orders in CEMEVYF')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  if (swagger.feature === FeatureEnum.ENABLED.toString()) {
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('swagger', app, document, {
      jsonDocumentUrl: 'swagger/json',
    });
  }
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: cors.allowedOrigins.split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });
  await app.listen(parseInt(port, 10));
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

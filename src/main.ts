import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
const { port, logLevel, swagger, cors } = require('config');
import { FeatureEnum } from './commons/types/feature.enum';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: [logLevel],
  });
  const options = new DocumentBuilder()
    .setTitle('CEMEVYF Health Orders Service')
    .setDescription('A service to provide basic management of Health Orders in CEMEVYF')
    .setVersion('1.0')
    .build();
  if (swagger.feature === FeatureEnum.ENABLED.toString()) {
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('swagger', app, document, {
      jsonDocumentUrl: 'swagger/json',
    });
  }
  app.enableCors({
    origin: cors.allowedOrigins.split(','),
    methods: ["GET", "POST", "PUT"],
  }),
  await app.listen(parseInt(port, 10));
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

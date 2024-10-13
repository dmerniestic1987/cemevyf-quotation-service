import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
const { port, logLevel } = require('config');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: [logLevel],
  });
  const options = new DocumentBuilder()
    .setTitle('CEMEVYF Health Orders Service')
    .setDescription('A service to provide basic management of CEMEVYF health orders')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('swagger', app, document);
  await app.listen(parseInt(port, 10));
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

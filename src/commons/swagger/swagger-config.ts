import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

/**
 * OpenAPI settings shared by the Swagger UI served by the application and the generated swagger.json file.
 */
export const buildSwaggerConfig = (): Omit<OpenAPIObject, 'paths'> =>
  new DocumentBuilder()
    .setTitle('CEMEVYF Health Orders Service')
    .setDescription('A service to provide basic management of Health Orders in CEMEVYF')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

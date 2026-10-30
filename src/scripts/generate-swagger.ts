import { mkdir, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../app.module';
import { buildSwaggerConfig } from '../commons/swagger/swagger-config';

export const DEFAULT_OUTPUT_PATH = 'docs/swagger.json';

/**
 * Builds the OpenAPI document of the application. The application is created in preview mode: the modules and
 * controllers are scanned but no provider is instantiated, so neither the database nor the configuration secrets
 * are needed.
 */
export const generateSwaggerDocument = async (): Promise<OpenAPIObject> => {
  let app: INestApplication;
  try {
    app = await NestFactory.create(AppModule, { preview: true, logger: false, abortOnError: false });
    return SwaggerModule.createDocument(app, buildSwaggerConfig());
  } finally {
    await app?.close();
  }
};

/**
 * Writes the OpenAPI document as formatted JSON, creating the directory when needed.
 */
export const writeSwaggerDocument = async (document: OpenAPIObject, outputPath: string): Promise<void> => {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`);
};

export const main = async (): Promise<void> => {
  try {
    const outputPath = resolve(process.argv[2] ?? DEFAULT_OUTPUT_PATH);
    await writeSwaggerDocument(await generateSwaggerDocument(), outputPath);
    console.log(`Swagger document written to ${outputPath}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
};

if (require.main === module) {
  void main();
}

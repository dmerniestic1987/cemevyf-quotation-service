import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { OpenAPIObject } from '@nestjs/swagger';
import { generateSwaggerDocument, main, writeSwaggerDocument } from './generate-swagger';

describe('generate-swagger', () => {
  let outputDir: string;

  beforeEach(async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'swagger-'));
  });

  afterEach(async () => {
    await rm(outputDir, { recursive: true, force: true });
  });

  describe('generateSwaggerDocument', () => {
    let document: OpenAPIObject;

    beforeAll(async () => {
      document = await generateSwaggerDocument();
    });

    it('uses the shared settings with Bearer authentication', () => {
      expect(document.info.title).toBe('CEMEVYF Health Orders Service');
      expect(document.components.securitySchemes).toHaveProperty('bearer');
    });

    it('documents the endpoint that updates the client of a health order', () => {
      const operation = document.paths['/health-orders/{id}/client']?.patch;

      expect(operation.operationId).toBe('updateHealthOrderClient');
      expect(operation.requestBody).toMatchObject({
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateHealthOrderClientRequestDto' } } },
      });
      expect(Object.keys(operation.responses)).toEqual(expect.arrayContaining(['200', '400', '404']));
    });
  });

  describe('writeSwaggerDocument', () => {
    it('writes the document as formatted JSON creating the directory', async () => {
      const outputPath = join(outputDir, 'nested', 'swagger.json');
      const document = { openapi: '3.0.0', info: { title: 't', version: '1' }, paths: {} };

      await writeSwaggerDocument(document, outputPath);

      expect(await readFile(outputPath, 'utf8')).toBe(`${JSON.stringify(document, null, 2)}\n`);
    });
  });

  describe('main', () => {
    const originalArgv = process.argv;

    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
      process.argv = originalArgv;
      process.exitCode = undefined;
      jest.restoreAllMocks();
    });

    it('writes the document to the path given as argument', async () => {
      const outputPath = join(outputDir, 'swagger.json');
      process.argv = ['node', 'generate-swagger', outputPath];

      await main();

      const written = JSON.parse(await readFile(outputPath, 'utf8'));
      expect(written.paths).toHaveProperty('/health-orders/{id}/client');
      expect(console.log).toHaveBeenCalledWith(`Swagger document written to ${outputPath}`);
      expect(process.exitCode).toBeUndefined();
    });

    it('reports the error and sets a failing exit code when the file cannot be written', async () => {
      const blockingFile = join(outputDir, 'file');
      await writeSwaggerDocument({ openapi: '3.0.0', info: { title: 't', version: '1' }, paths: {} }, blockingFile);
      process.argv = ['node', 'generate-swagger', join(blockingFile, 'swagger.json')];

      await main();

      expect(console.error).toHaveBeenCalled();
      expect(process.exitCode).toBe(1);
    });
  });
});

import { HttpStatus } from '@nestjs/common';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { LocalDiskFileStorageService } from './local-disk-file-storage.service';

const readAll = async (stream: NodeJS.ReadableStream): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

describe('LocalDiskFileStorageService', () => {
  let baseDir: string;
  let uploadDir: string;
  let storage: LocalDiskFileStorageService;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), 'cemevyf-storage-'));
    uploadDir = join(baseDir, 'uploadedFiles');
    storage = new LocalDiskFileStorageService(uploadDir);
    await storage.onModuleInit();
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  describe('onModuleInit', () => {
    it('creates the upload directory with private permissions', async () => {
      expect((await stat(uploadDir)).isDirectory()).toBe(true);
      expect((await stat(uploadDir)).mode & 0o777).toBe(0o700);
    });

    it('does not fail when the directory already exists', async () => {
      await expect(storage.onModuleInit()).resolves.toBeUndefined();
    });

    it('resolves a relative directory against the working directory', async () => {
      expect(new LocalDiskFileStorageService('relative-dir')['uploadDir']).toBe(join(process.cwd(), 'relative-dir'));
    });

    it('uses the configured directory by default', () => {
      expect(new LocalDiskFileStorageService()['uploadDir']).toContain('cemevyf-uploaded-files-test');
    });
  });

  describe('save', () => {
    it('writes the content under a unique generated name keeping the extension', async () => {
      const content = Buffer.from('%PDF-1.4 content');

      const storedFileName = await storage.save(content, '.pdf');

      expect(storedFileName).toMatch(/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}\.pdf$/);
      expect(await readFile(join(uploadDir, storedFileName))).toEqual(content);
    });

    it('writes the file with private permissions', async () => {
      const storedFileName = await storage.save(Buffer.from('x'), '.png');

      expect((await stat(join(uploadDir, storedFileName))).mode & 0o777).toBe(0o600);
    });

    it('generates a different name for every save, even with the same content', async () => {
      const names = await Promise.all([1, 2, 3].map(() => storage.save(Buffer.from('same'), '.jpg')));

      expect(new Set(names).size).toBe(3);
    });

    it.each(['.exe', '', '/../x.pdf'])('refuses an extension that is not allowed: %p', async extension => {
      await expect(storage.save(Buffer.from('x'), extension)).rejects.toThrow('Invalid stored file name');
    });
  });

  describe('createReadStream', () => {
    it('streams the stored content', async () => {
      const content = Buffer.from('%PDF-1.4 content');
      const storedFileName = await storage.save(content, '.pdf');

      expect(await readAll(await storage.createReadStream(storedFileName))).toEqual(content);
    });

    it('throws not found when the file is missing on disk', async () => {
      await expect(storage.createReadStream('3f2c1b7e-0d44-4a53-9a39-0f6a2f6a8c11.pdf')).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });

    it.each(['../secret.pdf', '../../etc/passwd', '/etc/passwd', 'a.pdf', '3f2c1b7e-0d44-4a53-9a39-0f6a2f6a8c11.exe'])(
      'refuses the tampered name %p',
      async name => {
        await expect(storage.createReadStream(name)).rejects.toThrow('Invalid stored file name');
      },
    );

    it('cannot read files outside the upload directory even if they exist', async () => {
      await writeFile(join(baseDir, 'secret.pdf'), 'secret');

      await expect(storage.createReadStream('../secret.pdf')).rejects.toThrow('Invalid stored file name');
    });
  });

  describe('delete', () => {
    it('removes the stored file', async () => {
      const storedFileName = await storage.save(Buffer.from('x'), '.png');

      await storage.delete(storedFileName);

      await expect(stat(join(uploadDir, storedFileName))).rejects.toMatchObject({ code: 'ENOENT' });
    });

    it('does not fail when the file does not exist', async () => {
      await expect(storage.delete('3f2c1b7e-0d44-4a53-9a39-0f6a2f6a8c11.pdf')).resolves.toBeUndefined();
    });

    it('rethrows unexpected file system errors', async () => {
      // a directory with a valid file name makes unlink fail with EISDIR/EPERM instead of ENOENT
      const name = '3f2c1b7e-0d44-4a53-9a39-0f6a2f6a8c11.pdf';
      await mkdir(join(uploadDir, name));

      await expect(storage.delete(name)).rejects.toMatchObject({ code: expect.stringMatching(/EISDIR|EPERM/) });
    });

    it('refuses a tampered name', async () => {
      await expect(storage.delete('../x.pdf')).rejects.toThrow('Invalid stored file name');
    });
  });
});

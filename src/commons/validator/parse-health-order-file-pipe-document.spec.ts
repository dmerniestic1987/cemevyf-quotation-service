import { BadRequestException } from '@nestjs/common';
import { files as filesConfig } from 'config';
import { ParseHealthOrderFilePipeDocument } from './parse-health-order-file-pipe-document';

const buildFile = (originalname: string, size = 100): Express.Multer.File =>
  ({ originalname, size, mimetype: 'application/octet-stream', buffer: Buffer.from('') }) as Express.Multer.File;

describe('ParseHealthOrderFilePipeDocument', () => {
  const pipe = new ParseHealthOrderFilePipeDocument();
  const maxSizeInBytes = 1024 * 1024 * Number(filesConfig.maxFileSizeInMb);

  it.each(['order.png', 'order.pdf', 'order.jpg', 'order.jpeg', 'ORDER.PDF', 'Order.JpG'])(
    'accepts %p',
    originalname => {
      const file = buildFile(originalname);
      expect(pipe.transform(file)).toBe(file);
    },
  );

  it('throws when no file is uploaded', () => {
    expect(() => pipe.transform(undefined)).toThrow(new BadRequestException('A file is required'));
  });

  it.each(['order.exe', 'order.gif', 'order'])('rejects unsupported extension %p', originalname => {
    expect(() => pipe.transform(buildFile(originalname))).toThrow(BadRequestException);
  });

  it('accepts a file of exactly the max size', () => {
    const file = buildFile('order.pdf', maxSizeInBytes);
    expect(pipe.transform(file)).toBe(file);
  });

  it('rejects a file bigger than the max size', () => {
    expect(() => pipe.transform(buildFile('order.pdf', maxSizeInBytes + 1))).toThrow(BadRequestException);
  });
});

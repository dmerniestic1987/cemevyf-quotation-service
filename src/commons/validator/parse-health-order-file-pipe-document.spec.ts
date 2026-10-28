import { BadRequestException } from '@nestjs/common';
import config from 'config';
import { ParseHealthOrderFilePipeDocument } from './parse-health-order-file-pipe-document';

const filesConfig = config.get<{ maxFileSizeInMb: number | string }>('files');

const PDF = Buffer.from('%PDF-1.4 content');
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

const buildFile = (originalname: string, size = 100, buffer = PDF): Express.Multer.File =>
  ({ originalname, size, mimetype: 'application/octet-stream', buffer }) as Express.Multer.File;

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

  it('rejects a file whose content is not a PNG, JPG or PDF even with an allowed extension', () => {
    const file = buildFile('order.pdf', 100, Buffer.from('MZ\x90\x00 not a pdf'));

    expect(() => pipe.transform(file)).toThrow(new BadRequestException('File content is not a valid PNG, JPG or PDF'));
  });

  it.each([
    ['order.pdf', PDF, 'application/pdf'],
    ['order.png', PNG, 'image/png'],
    ['order.jpg', JPEG, 'image/jpeg'],
    ['renamed.png', PDF, 'application/pdf'],
  ])('replaces the MIME type declared by the client with the one detected in %p', (name, content, expected) => {
    const file = buildFile(name, 100, content);

    expect(pipe.transform(file).mimetype).toBe(expected);
  });
});

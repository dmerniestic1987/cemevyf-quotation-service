import { detectFileType } from './detect-file-type';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const PDF = Buffer.from('%PDF-1.7\n...');

describe('detectFileType', () => {
  it.each([
    ['PNG', PNG, { mimeType: 'image/png', extension: '.png' }],
    ['JPEG', JPEG, { mimeType: 'image/jpeg', extension: '.jpg' }],
    ['PDF', PDF, { mimeType: 'application/pdf', extension: '.pdf' }],
  ])('detects %s by its magic bytes', (_name, content, expected) => {
    expect(detectFileType(content)).toEqual(expected);
  });

  it.each([
    ['a Windows executable', Buffer.from('MZ\x90\x00')],
    ['a GIF', Buffer.from('GIF89a')],
    ['plain text', Buffer.from('hello')],
    ['an empty buffer', Buffer.alloc(0)],
    ['a truncated PNG signature', PNG.subarray(0, 4)],
    ['a truncated PDF signature', PDF.subarray(0, 4)],
  ])('returns null for %s', (_name, content) => {
    expect(detectFileType(content)).toBeNull();
  });

  it('returns null when there is no content', () => {
    expect(detectFileType(undefined)).toBeNull();
  });

  it('returns a copy so callers cannot alter the known types', () => {
    detectFileType(PNG).extension = '.exe';

    expect(detectFileType(PNG).extension).toBe('.png');
  });
});

export interface DetectedFileType {
  mimeType: string;
  extension: string;
}

const SIGNATURES: { signature: number[]; type: DetectedFileType }[] = [
  { signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], type: { mimeType: 'image/png', extension: '.png' } },
  { signature: [0xff, 0xd8, 0xff], type: { mimeType: 'image/jpeg', extension: '.jpg' } },
  { signature: [0x25, 0x50, 0x44, 0x46, 0x2d], type: { mimeType: 'application/pdf', extension: '.pdf' } },
];

/**
 * Detects PNG, JPEG and PDF files by their magic bytes, ignoring any name or MIME type sent by the client.
 * Returns null when the content is none of them.
 */
export const detectFileType = (content: Buffer): DetectedFileType | null => {
  if (!content) {
    return null;
  }
  const match = SIGNATURES.find(({ signature }) => signature.every((byte, index) => content[index] === byte));
  return match ? { ...match.type } : null;
};

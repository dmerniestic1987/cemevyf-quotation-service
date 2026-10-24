import { Readable } from 'stream';

export interface HealthOrderFileDownload {
  stream: Readable;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
}

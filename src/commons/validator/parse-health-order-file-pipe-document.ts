import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { extname } from 'path';
import { files as filesConfig } from 'config';

const MAX_FILE_SIZE_IN_BYTES = 1024 * 1024 * Number(filesConfig.maxFileSizeInMb);

@Injectable()
export class ParseHealthOrderFilePipeDocument implements PipeTransform {
  private readonly allowedExtensions = ['.png', '.pdf', '.jpeg', '.jpg'];

  transform(value: Express.Multer.File): Express.Multer.File {
    const extension = extname(value.originalname);
    if (!this.allowedExtensions.includes(extension)) {
      throw new BadRequestException(`File type ${extension} not supported`);
    }

    if (value.size > MAX_FILE_SIZE_IN_BYTES) {
      throw new BadRequestException(`File too big. Max allowed size in : ${filesConfig.maxFileSizeInMb} MB`);
    }
    return value;
  }
}

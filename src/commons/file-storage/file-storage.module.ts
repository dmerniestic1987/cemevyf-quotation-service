import { Module } from '@nestjs/common';
import { FILE_STORAGE } from './file-storage';
import { LocalDiskFileStorageService } from './local-disk-file-storage.service';

@Module({
  providers: [
    LocalDiskFileStorageService,
    {
      provide: FILE_STORAGE,
      useExisting: LocalDiskFileStorageService,
    },
  ],
  exports: [FILE_STORAGE],
})
export class FileStorageModule {}

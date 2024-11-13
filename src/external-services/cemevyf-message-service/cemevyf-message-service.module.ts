import { Module } from '@nestjs/common';
import { CemevyfMessageService } from './cemevyf-message.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
    }),
  ],
  providers: [CemevyfMessageService],
  exports: [CemevyfMessageService],
})
export class CemevyfMessageServiceModule {}

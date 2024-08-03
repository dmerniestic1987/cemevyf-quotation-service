import { Module } from '@nestjs/common';
import { CemevyfMessageService } from './cemevyf-message.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [CemevyfMessageService],
  exports: [CemevyfMessageService],
})
export class CemevyfMessageServiceModule {}

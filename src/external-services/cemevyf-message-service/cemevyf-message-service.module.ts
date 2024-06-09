import { Module } from '@nestjs/common';
import { AbstractionLayerService } from './abstraction-layer.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [AbstractionLayerService],
  exports: [AbstractionLayerService],
})
export class AbstractionLayerModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseServiceModule } from 'src/commons/service/base-service.module';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { Client } from './client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client]), BaseServiceModule],
  providers: [ClientService],
  controllers: [ClientController],
})
export class ClientModule {}

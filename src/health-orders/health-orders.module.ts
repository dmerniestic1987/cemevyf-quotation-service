import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthOrderController } from './health-order.controller';
import { BaseServiceModule } from 'src/commons/service/base-service.module';
import { HealthOrderRepository } from './health-order.repository';
import { HealthOrderService } from './health-order.service';
import { Client } from '../clients/client.entity';
import { HealthOrderItem } from './health-order-item.entity';
import { HealthOrder } from './health-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client, HealthOrder, HealthOrderItem]), BaseServiceModule],
  providers: [HealthOrderRepository, HealthOrderService],
  controllers: [HealthOrderController],
  exports: [HealthOrderRepository, HealthOrderService],
})
export class HealthOrdersModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmOptions } from '../datasource.config';
import { ExternalServicesModule } from './external-services/external-services.module';
import { HealthOrdersModule } from './health-orders/health-orders.module';
import { ClientModule } from './clients/client.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmOptions),
    ClientModule,
    HealthOrdersModule,
    ExternalServicesModule,
  ],
})
export class AppModule {}

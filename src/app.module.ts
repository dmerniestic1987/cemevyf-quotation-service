import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmOptions } from '../datasource.config';
import { ExternalServicesModule } from './external-services/external-services.module';
import { HealthOrdersModule } from './health-orders/health-orders.module';
import { ClientModule } from './clients/client.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmOptions),
    AuthModule,
    UsersModule,
    ClientModule,
    HealthOrdersModule,
    ExternalServicesModule,
  ],
})
export class AppModule {}

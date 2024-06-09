import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmOptions } from '../datasource.config';
import { QuotationsModule } from './quotations/quotations.module';
import {ExternalServicesModule} from "./external-services/external-services.module";

@Module({
  imports: [
      ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmOptions),
    QuotationsModule,
    ExternalServicesModule],
})
export class AppModule {}

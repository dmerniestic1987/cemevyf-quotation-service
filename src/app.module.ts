import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmOptions } from '../datasource.config';
import { QuotationsModule } from './quotations/quotations.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TypeOrmModule.forRoot(typeOrmOptions), QuotationsModule],
})
export class AppModule {}

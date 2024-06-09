import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotationsController } from './quotations.controller';
import { BaseRepositoryModule } from 'src/commons/repository/base-repository.module';
import { QuotationsRepository } from './quotations.repository';
import { Quotation } from './quotation.entity';
import { QuotationsService } from './quotations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Quotation]), BaseRepositoryModule],
  providers: [QuotationsRepository, QuotationsService],
  controllers: [QuotationsController],
  exports: [QuotationsRepository, QuotationsService],
})
export class QuotationsModule {}

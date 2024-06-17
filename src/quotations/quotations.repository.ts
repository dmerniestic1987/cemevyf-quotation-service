import { Logger } from '@nestjs/common';
import { Quotation } from './quotation.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Client } from '../clients/client.entity';
import { createQuotationInternalError } from '../commons/errors/exceptions';
import { QuotationItem } from './quotation-item.entity';

export class QuotationsRepository {
  private readonly logger = new Logger(QuotationsRepository.name);
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  getRepository(): Repository<Quotation> {
    return this.dataSource.getRepository<Quotation>(Quotation);
  }

  async createQuotation(quotation: Quotation, client: Client): Promise<Quotation> {
    this.logger.debug('Create quotation', { service: QuotationsRepository.name, id: quotation.id });
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      quotation = await queryRunner.manager.save(quotation);
      await queryRunner.manager.save(quotation.quotationItems);
      await queryRunner.manager.save(client);
      await queryRunner.commitTransaction();
      return quotation;
    } catch (err) {
      this.logger.error(JSON.stringify(err));
      await queryRunner.rollbackTransaction();
      throw createQuotationInternalError(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async updateQuotation(quotation: Quotation): Promise<Quotation> {
    this.logger.debug('Update quotation', { service: QuotationsRepository.name, id: quotation.id });
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.delete(QuotationItem, { quotationId: quotation.id });
      quotation = await queryRunner.manager.save(quotation);
      await queryRunner.manager.save(quotation.quotationItems);
      await queryRunner.commitTransaction();
      return quotation;
    } catch (err) {
      this.logger.error('Error updating quotation', JSON.stringify(err));
      await queryRunner.rollbackTransaction();
      throw createQuotationInternalError(err.message);
    } finally {
      await queryRunner.release();
    }
  }
}

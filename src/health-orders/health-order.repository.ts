import { Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Client } from '../clients/client.entity';
import { createQuotationInternalError, notFoundError } from '../commons/errors/exceptions';
import { HealthOrderItem } from './health-order-item.entity';
import { HealthOrder } from './health-order.entity';

export class HealthOrderRepository {
  private readonly logger = new Logger(HealthOrderRepository.name);
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  getRepository(): Repository<HealthOrder> {
    return this.dataSource.getRepository<HealthOrder>(HealthOrder);
  }

  async createQuotation(quotation: HealthOrder, client: Client): Promise<HealthOrder> {
    this.logger.debug('Create quotation', { service: HealthOrderRepository.name, id: quotation.id });
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      quotation = await queryRunner.manager.save(quotation);
      await queryRunner.manager.save(quotation.healthOrderItems);
      await queryRunner.manager.save(client);
      await queryRunner.commitTransaction();
      return quotation;
    } catch (err) {
      this.logger.error('Error creating quotation', JSON.stringify(err));
      await queryRunner.rollbackTransaction();
      throw createQuotationInternalError(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async updateQuotation(quotation: HealthOrder): Promise<HealthOrder> {
    this.logger.debug('Update quotation', { service: HealthOrderRepository.name, id: quotation.id });
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.delete(HealthOrderItem, { quotationId: quotation.id });
      quotation = await queryRunner.manager.save(quotation);
      await queryRunner.manager.save(quotation.healthOrderItems);
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

  public async getQuotationAndFail(id: number, relations = ['quotationItems']): Promise<HealthOrder> {
    const quotation = await this.getRepository().findOne({
      where: {
        id,
      },
      relations,
    });
    if (!quotation) {
      throw notFoundError(`Quotation ID: ${id} was not found`);
    }
    return quotation;
  }
}

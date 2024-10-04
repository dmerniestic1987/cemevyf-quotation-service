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

  async createHealthOrder(healthOrder: HealthOrder, client: Client): Promise<HealthOrder> {
    this.logger.debug('Create Health Order', { service: HealthOrderRepository.name, id: healthOrder.id });
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      healthOrder = await queryRunner.manager.save(healthOrder);
      await queryRunner.manager.save(healthOrder.healthOrderItems);
      await queryRunner.manager.save(client);
      await queryRunner.commitTransaction();
      return healthOrder;
    } catch (err) {
      this.logger.error('Error creating quotation', JSON.stringify(err));
      await queryRunner.rollbackTransaction();
      throw createQuotationInternalError(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async updateQuotation(healthOrder: HealthOrder): Promise<HealthOrder> {
    this.logger.debug('Update healthOrder', { service: HealthOrderRepository.name, id: healthOrder.id });
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.delete(HealthOrderItem, { quotationId: healthOrder.id });
      healthOrder = await queryRunner.manager.save(healthOrder);
      await queryRunner.manager.save(healthOrder.healthOrderItems);
      await queryRunner.commitTransaction();
      return healthOrder;
    } catch (err) {
      this.logger.error('Error updating healthOrder', JSON.stringify(err));
      await queryRunner.rollbackTransaction();
      throw createQuotationInternalError(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  public async getHealthOrderAndFail(id: number, relations = ['healthOrderItems']): Promise<HealthOrder> {
    const healthOrder = await this.getRepository().findOne({
      where: {
        id,
      },
      relations,
    });
    if (!healthOrder) {
      throw notFoundError(`Health Order ID: ${id} was not found`);
    }
    return healthOrder;
  }
}

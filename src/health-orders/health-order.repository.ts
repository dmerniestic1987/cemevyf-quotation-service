import { Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { createQuotationInternalError, notFoundError } from '../commons/errors/exceptions';
import { HealthOrderItem } from './health-order-item.entity';
import { HealthOrder } from './health-order.entity';
import { HealthOrderStatus } from './types/health-order-status';
import { HealthOrderFile } from './health-order-file.entity';
import { HealthOrderResult } from './health-order-result.entity';

export interface HealthOrderFileData {
  mimeType: string;
  fileData: Buffer;
  additionalNotes?: string;
}

export class HealthOrderRepository {
  private readonly logger = new Logger(HealthOrderRepository.name);
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  getRepository(): Repository<HealthOrder> {
    return this.dataSource.getRepository<HealthOrder>(HealthOrder);
  }

  async updateHealthOrder(healthOrder: HealthOrder): Promise<HealthOrder> {
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

  async createHealthOrder(healthOrder: HealthOrder): Promise<HealthOrder> {
    this.logger.debug('Create Health Order', { service: HealthOrderRepository.name, id: healthOrder.id });
    try {
      return await this.dataSource.transaction(async entityManager => {
        const savedHealthOrder = await entityManager.save(healthOrder);
        await entityManager.save(healthOrder.healthOrderItems);
        return savedHealthOrder;
      });
    } catch (err) {
      this.logger.error('Error creating health order', JSON.stringify(err));
      throw createQuotationInternalError(err.message);
    }
  }

  async executeOrder(id: number): Promise<HealthOrder> {
    this.logger.debug('Execute Health Order', { service: HealthOrderRepository.name, id });
    return await this.dataSource.transaction(async entityManager => {
      const healthOrder = await entityManager.findOne(HealthOrder, {
        where: {
          id,
        },
      });
      healthOrder.status = HealthOrderStatus.EXECUTED;
      healthOrder.executedAt = new Date();
      await entityManager.save(healthOrder);
      return healthOrder;
    });
  }

  async attachHealthOrderFile(id: number, healthOrderFile: HealthOrderFileData): Promise<string> {
    this.logger.debug('Attach file to health order', { service: HealthOrderRepository.name, id });
    return await this.dataSource.transaction(async entityManager => {
      const healthOrder = await entityManager.findOne(HealthOrder, {
        where: {
          id,
        },
        relations: ['healthOrderFiles'],
      });
      let file = new HealthOrderFile();
      file.healthOrder = healthOrder;
      file.mimeType = healthOrderFile.mimeType;
      file.fileData = healthOrderFile.fileData;
      file.additionalNotes = healthOrderFile.additionalNotes;
      file.createdAt = new Date();

      healthOrder.healthOrderFiles.push(file);
      file = await entityManager.save(file);
      await entityManager.save(healthOrder);
      return file.id;
    });
  }

  async attachHealthResultFile(id: number, healthOrderFile: HealthOrderFileData): Promise<string> {
    this.logger.debug('Attach result file to health order', { service: HealthOrderRepository.name, id });
    return await this.dataSource.transaction(async entityManager => {
      const healthOrder = await entityManager.findOne(HealthOrder, {
        where: {
          id: id,
        },
        relations: ['healthOrderResults'],
      });
      let result = new HealthOrderResult();
      result.healthOrder = healthOrder;
      result.fileData = healthOrderFile.fileData;
      result.mimeType = healthOrderFile.mimeType;
      result.additionalNotes = healthOrderFile.additionalNotes || null;
      result.createdAt = new Date();

      healthOrder.healthOrderResults.push(result);
      result = await entityManager.save(result);
      await entityManager.save(healthOrder);
      return result.id;
    });
  }
}

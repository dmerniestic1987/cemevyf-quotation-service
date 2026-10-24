import { Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  createQuotationInternalError,
  healthOrderIncorrectStatusError,
  notFoundError,
} from '../commons/errors/exceptions';
import { HealthOrderItem } from './health-order-item.entity';
import { HealthOrder } from './health-order.entity';
import { HealthOrderStatus, nextStatusMap } from './types/health-order-status';
import { HealthOrderFile } from './health-order-file.entity';
import { HealthOrderFileType } from './types/health-order-file-type';

export interface HealthOrderFileData {
  mimeType: string;
  storedFileName: string;
  originalName: string;
  sizeBytes: number;
  checksumSha256: string;
  fileType: HealthOrderFileType;
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

  /**
   * Updates a health order. When replaceItems is true, all current items are deleted and replaced by
   * healthOrder.healthOrderItems within the same transaction.
   */
  async updateHealthOrder(healthOrder: HealthOrder, replaceItems = false): Promise<HealthOrder> {
    this.logger.debug('Update healthOrder', { service: HealthOrderRepository.name, id: healthOrder.id });
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (replaceItems) {
        await queryRunner.manager.delete(HealthOrderItem, { orderId: healthOrder.id });
      }
      const savedHealthOrder = await queryRunner.manager.save(healthOrder);
      if (replaceItems) {
        await queryRunner.manager.save(healthOrder.healthOrderItems);
      }
      await queryRunner.commitTransaction();
      return savedHealthOrder;
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
    this.logger.debug('Create Health Order', { service: HealthOrderRepository.name });
    try {
      return await this.dataSource.transaction(async entityManager => {
        const savedHealthOrder = await entityManager.save(healthOrder);
        healthOrder.healthOrderItems.forEach(item => {
          item.orderId = savedHealthOrder.id;
        });
        await entityManager.save(healthOrder.healthOrderItems);
        return savedHealthOrder;
      });
    } catch (err) {
      this.logger.error('Error creating health order', JSON.stringify(err));
      throw createQuotationInternalError(err.message);
    }
  }

  /**
   * Moves the health order to newStatus. The current status is read with a row lock inside the transaction, so
   * concurrent requests cannot apply the same transition twice.
   */
  async updateHealthOrderStatus(id: number, newStatus: HealthOrderStatus): Promise<HealthOrder> {
    this.logger.debug('Update Health Order status', { service: HealthOrderRepository.name, id });
    return await this.dataSource.transaction(async entityManager => {
      const healthOrder = await entityManager.findOne(HealthOrder, {
        where: {
          id,
        },
        lock: { mode: 'pessimistic_write' },
      });
      if (!healthOrder) {
        throw notFoundError(`Health Order ID: ${id} was not found`);
      }
      if (nextStatusMap.get(healthOrder.status) !== newStatus) {
        throw healthOrderIncorrectStatusError();
      }
      healthOrder.status = newStatus;
      if (newStatus === HealthOrderStatus.EXECUTED) {
        healthOrder.executedAt = new Date();
      }
      return await entityManager.save(healthOrder);
    });
  }

  async attachHealthOrderFile(id: number, healthOrderFile: HealthOrderFileData): Promise<string> {
    this.logger.debug('Attach file to health order', { service: HealthOrderRepository.name, id });
    const file = new HealthOrderFile();
    file.healthOrder = { id } as HealthOrder;
    file.mimeType = healthOrderFile.mimeType;
    file.storedFileName = healthOrderFile.storedFileName;
    file.originalName = healthOrderFile.originalName;
    file.sizeBytes = healthOrderFile.sizeBytes;
    file.checksumSha256 = healthOrderFile.checksumSha256;
    file.additionalNotes = healthOrderFile.additionalNotes;
    file.fileType = healthOrderFile.fileType || HealthOrderFileType.HEALTH_ORDER_PRESCRIPTION;
    const savedFile = await this.dataSource.getRepository(HealthOrderFile).save(file);
    return savedFile.id;
  }

  async findHealthOrderFiles(orderId: number): Promise<HealthOrderFile[]> {
    return await this.dataSource.getRepository(HealthOrderFile).find({
      where: { healthOrder: { id: orderId } },
      order: { createdAt: 'ASC' },
    });
  }

  async findHealthOrderFile(orderId: number, fileId: string): Promise<HealthOrderFile | null> {
    return await this.dataSource.getRepository(HealthOrderFile).findOne({
      where: { id: fileId, healthOrder: { id: orderId } },
    });
  }
}

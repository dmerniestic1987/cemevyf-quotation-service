import { HttpStatus } from '@nestjs/common';
import { HealthOrderRepository } from './health-order.repository';
import { HealthOrder } from './health-order.entity';
import { HealthOrderItem } from './health-order-item.entity';
import { HealthOrderFile } from './health-order-file.entity';
import { HealthOrderStatus } from './types/health-order-status';
import { HealthOrderFileType } from './types/health-order-file-type';

const buildHealthOrder = (overrides: Partial<HealthOrder> = {}): HealthOrder =>
  Object.assign(new HealthOrder(), { id: 7, status: HealthOrderStatus.QUOTED, healthOrderItems: [] }, overrides);

const buildItem = (id: number): HealthOrderItem => Object.assign(new HealthOrderItem(), { id, name: `item ${id}` });

describe('HealthOrderRepository', () => {
  let entityManager: { save: jest.Mock; delete: jest.Mock; findOne: jest.Mock };
  let queryRunner: Record<string, jest.Mock | typeof entityManager>;
  let ormRepository: { findOne: jest.Mock; save: jest.Mock };
  let dataSource: { createQueryRunner: jest.Mock; getRepository: jest.Mock; transaction: jest.Mock };
  let repository: HealthOrderRepository;

  beforeEach(() => {
    entityManager = {
      save: jest.fn(async entity => entity),
      delete: jest.fn(),
      findOne: jest.fn(),
    };
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: entityManager,
    };
    ormRepository = { findOne: jest.fn(), save: jest.fn() };
    dataSource = {
      createQueryRunner: jest.fn(() => queryRunner),
      getRepository: jest.fn(() => ormRepository),
      transaction: jest.fn(async work => work(entityManager)),
    };
    repository = new HealthOrderRepository(dataSource as any);
  });

  describe('getRepository', () => {
    it('returns the HealthOrder repository', () => {
      expect(repository.getRepository()).toBe(ormRepository);
      expect(dataSource.getRepository).toHaveBeenCalledWith(HealthOrder);
    });
  });

  describe('getHealthOrderAndFail', () => {
    it('returns the health order with the default relations', async () => {
      const healthOrder = buildHealthOrder();
      ormRepository.findOne.mockResolvedValue(healthOrder);

      await expect(repository.getHealthOrderAndFail(7)).resolves.toBe(healthOrder);
      expect(ormRepository.findOne).toHaveBeenCalledWith({ where: { id: 7 }, relations: ['healthOrderItems'] });
    });

    it('throws not found when the health order does not exist', async () => {
      ormRepository.findOne.mockResolvedValue(null);

      await expect(repository.getHealthOrderAndFail(7, [])).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
    });
  });

  describe('createHealthOrder', () => {
    it('saves the order first and then its items with the generated order ID', async () => {
      const items = [buildItem(0), buildItem(1)];
      const healthOrder = buildHealthOrder({ id: undefined, healthOrderItems: items });
      entityManager.save.mockImplementationOnce(async entity => Object.assign(entity, { id: 42 }));

      const result = await repository.createHealthOrder(healthOrder);

      expect(result.id).toBe(42);
      expect(entityManager.save).toHaveBeenNthCalledWith(1, healthOrder);
      expect(entityManager.save).toHaveBeenNthCalledWith(2, items);
      expect(items.map(item => item.orderId)).toEqual([42, 42]);
    });

    it('wraps errors into an internal error', async () => {
      entityManager.save.mockRejectedValue(new Error('db down'));

      await expect(repository.createHealthOrder(buildHealthOrder())).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('updateHealthOrder', () => {
    it('replaces the items using the order ID when replaceItems is true', async () => {
      const items = [buildItem(0)];
      const healthOrder = buildHealthOrder({ healthOrderItems: items });

      await expect(repository.updateHealthOrder(healthOrder, true)).resolves.toBe(healthOrder);

      expect(entityManager.delete).toHaveBeenCalledWith(HealthOrderItem, { orderId: 7 });
      expect(entityManager.save).toHaveBeenNthCalledWith(1, healthOrder);
      expect(entityManager.save).toHaveBeenNthCalledWith(2, items);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('keeps the items when replaceItems is false', async () => {
      const healthOrder = buildHealthOrder();

      await repository.updateHealthOrder(healthOrder);

      expect(entityManager.delete).not.toHaveBeenCalled();
      expect(entityManager.save).toHaveBeenCalledTimes(1);
      expect(entityManager.save).toHaveBeenCalledWith(healthOrder);
    });

    it('rolls back and wraps errors', async () => {
      entityManager.save.mockRejectedValue(new Error('db down'));

      await expect(repository.updateHealthOrder(buildHealthOrder(), true)).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('updateHealthOrderStatus', () => {
    it('reads the order with a write lock', async () => {
      entityManager.findOne.mockResolvedValue(buildHealthOrder());

      await repository.updateHealthOrderStatus(7, HealthOrderStatus.EXECUTED);

      expect(entityManager.findOne).toHaveBeenCalledWith(HealthOrder, {
        where: { id: 7 },
        lock: { mode: 'pessimistic_write' },
      });
    });

    it('sets the execution date when moving to EXECUTED', async () => {
      entityManager.findOne.mockResolvedValue(buildHealthOrder());

      const result = await repository.updateHealthOrderStatus(7, HealthOrderStatus.EXECUTED);

      expect(result.status).toBe(HealthOrderStatus.EXECUTED);
      expect(result.executedAt).toBeInstanceOf(Date);
    });

    it('keeps the execution date on later transitions', async () => {
      const executedAt = new Date('2026-01-01T00:00:00.000Z');
      entityManager.findOne.mockResolvedValue(buildHealthOrder({ status: HealthOrderStatus.EXECUTED, executedAt }));

      const result = await repository.updateHealthOrderStatus(7, HealthOrderStatus.PENDING_RESULTS);

      expect(result.status).toBe(HealthOrderStatus.PENDING_RESULTS);
      expect(result.executedAt).toBe(executedAt);
    });

    it('throws not found when the order does not exist', async () => {
      entityManager.findOne.mockResolvedValue(null);

      await expect(repository.updateHealthOrderStatus(7, HealthOrderStatus.EXECUTED)).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });

    it.each([
      [HealthOrderStatus.QUOTED, HealthOrderStatus.QUOTED],
      [HealthOrderStatus.QUOTED, HealthOrderStatus.RESULTS_DONE],
      [HealthOrderStatus.EXECUTED, HealthOrderStatus.EXECUTED],
      [HealthOrderStatus.RESULTS_DONE, HealthOrderStatus.EXECUTED],
    ])('rejects the transition from %p to %p', async (currentStatus, newStatus) => {
      entityManager.findOne.mockResolvedValue(buildHealthOrder({ status: currentStatus }));

      await expect(repository.updateHealthOrderStatus(7, newStatus)).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
      expect(entityManager.save).not.toHaveBeenCalled();
    });
  });

  describe('attachHealthOrderFile', () => {
    it('saves the file referencing the order without loading other files', async () => {
      ormRepository.save.mockImplementation(async file => Object.assign(file, { id: 'file-id' }));
      const fileData = Buffer.from('data');

      const fileId = await repository.attachHealthOrderFile(7, {
        mimeType: 'application/pdf',
        fileData,
        fileType: HealthOrderFileType.HEALTH_ORDER_RESULT,
        additionalNotes: 'notes',
      });

      expect(fileId).toBe('file-id');
      expect(dataSource.getRepository).toHaveBeenCalledWith(HealthOrderFile);
      expect(ormRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          healthOrder: { id: 7 },
          mimeType: 'application/pdf',
          fileData,
          fileType: HealthOrderFileType.HEALTH_ORDER_RESULT,
          additionalNotes: 'notes',
        }),
      );
      expect(entityManager.findOne).not.toHaveBeenCalled();
    });

    it('defaults the file type to prescription', async () => {
      ormRepository.save.mockImplementation(async file => Object.assign(file, { id: 'file-id' }));

      await repository.attachHealthOrderFile(7, {
        mimeType: 'image/png',
        fileData: Buffer.from(''),
        fileType: undefined,
      });

      expect(ormRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ fileType: HealthOrderFileType.HEALTH_ORDER_PRESCRIPTION }),
      );
    });
  });
});

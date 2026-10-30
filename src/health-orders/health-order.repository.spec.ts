import { HttpStatus } from '@nestjs/common';
import { HealthOrderRepository } from './health-order.repository';
import { HealthOrder } from './health-order.entity';
import { HealthOrderItem } from './health-order-item.entity';
import { HealthOrderFile } from './health-order-file.entity';
import { HealthOrderStatus } from './types/health-order-status';
import { In } from 'typeorm';
import { HealthOrderFileType } from './types/health-order-file-type';
import { Client } from '../clients/client.entity';

const buildHealthOrder = (overrides: Partial<HealthOrder> = {}): HealthOrder =>
  Object.assign(new HealthOrder(), { id: 7, status: HealthOrderStatus.QUOTED, healthOrderItems: [] }, overrides);

const buildItem = (id: number): HealthOrderItem => Object.assign(new HealthOrderItem(), { id, name: `item ${id}` });

describe('HealthOrderRepository', () => {
  let entityManager: { save: jest.Mock; delete: jest.Mock; findOne: jest.Mock; find: jest.Mock };
  let queryRunner: Record<string, jest.Mock | typeof entityManager>;
  let ormRepository: { findOne: jest.Mock; save: jest.Mock; find: jest.Mock };
  let dataSource: { createQueryRunner: jest.Mock; getRepository: jest.Mock; transaction: jest.Mock };
  let repository: HealthOrderRepository;

  beforeEach(() => {
    entityManager = {
      save: jest.fn(async entity => entity),
      delete: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: entityManager,
    };
    ormRepository = { findOne: jest.fn(), save: jest.fn(), find: jest.fn() };
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
      expect(ormRepository.findOne).toHaveBeenCalledWith({ where: { id: 7 }, relations: { healthOrderItems: true } });
    });

    it('throws not found when the health order does not exist', async () => {
      ormRepository.findOne.mockResolvedValue(null);

      await expect(repository.getHealthOrderAndFail(7, {})).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
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

  describe('updateHealthOrderClient', () => {
    const client = Object.assign(new Client(), { id: '14e7b437-3c5c-44a6-8d99-a0fab3ef6c40' });

    it('reads the order with a write lock and saves it with the new client', async () => {
      entityManager.findOne.mockResolvedValue(buildHealthOrder());

      const result = await repository.updateHealthOrderClient(7, client);

      expect(entityManager.findOne).toHaveBeenCalledWith(HealthOrder, {
        where: { id: 7 },
        lock: { mode: 'pessimistic_write' },
      });
      expect(result.client).toBe(client);
      expect(entityManager.save).toHaveBeenCalledWith(result);
    });

    it('throws not found when the order does not exist', async () => {
      entityManager.findOne.mockResolvedValue(null);

      await expect(repository.updateHealthOrderClient(7, client)).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
      expect(entityManager.save).not.toHaveBeenCalled();
    });

    it.each([HealthOrderStatus.EXECUTED, HealthOrderStatus.PENDING_RESULTS, HealthOrderStatus.RESULTS_DONE])(
      'rejects an order in %p status without saving it',
      async status => {
        entityManager.findOne.mockResolvedValue(buildHealthOrder({ status }));

        await expect(repository.updateHealthOrderClient(7, client)).rejects.toMatchObject({
          status: HttpStatus.BAD_REQUEST,
        });
        expect(entityManager.save).not.toHaveBeenCalled();
      },
    );
  });

  describe('bulkUpdateHealthOrderStatus', () => {
    // MySQL returns bigint columns as strings, so the IDs of the loaded orders are strings in real life
    const buildStoredOrder = (id: number, status: HealthOrderStatus, overrides: Partial<HealthOrder> = {}) =>
      buildHealthOrder({ id: String(id) as unknown as number, status, ...overrides });

    const getThrown = async (promise: Promise<unknown>) =>
      promise.then(
        () => undefined,
        error => error,
      );

    it('reads the orders ordered by ID with a write lock', async () => {
      entityManager.find.mockResolvedValue([buildStoredOrder(1, HealthOrderStatus.QUOTED)]);

      await repository.bulkUpdateHealthOrderStatus([1], HealthOrderStatus.EXECUTED);

      expect(entityManager.find).toHaveBeenCalledWith(HealthOrder, {
        where: { id: In([1]) },
        order: { id: 'ASC' },
        lock: { mode: 'pessimistic_write' },
      });
    });

    it('moves every order to the new status in one save and returns them in the requested order', async () => {
      entityManager.find.mockResolvedValue([
        buildStoredOrder(1, HealthOrderStatus.EXECUTED),
        buildStoredOrder(2, HealthOrderStatus.EXECUTED),
        buildStoredOrder(3, HealthOrderStatus.EXECUTED),
      ]);

      const result = await repository.bulkUpdateHealthOrderStatus([3, 1, 2], HealthOrderStatus.PENDING_RESULTS);

      expect(entityManager.save).toHaveBeenCalledTimes(1);
      expect(result.map(order => String(order.id))).toEqual(['3', '1', '2']);
      expect(result.every(order => order.status === HealthOrderStatus.PENDING_RESULTS)).toBe(true);
    });

    it('sets the execution date only when moving to EXECUTED', async () => {
      entityManager.find.mockResolvedValue([buildStoredOrder(1, HealthOrderStatus.QUOTED)]);

      const [executed] = await repository.bulkUpdateHealthOrderStatus([1], HealthOrderStatus.EXECUTED);

      expect(executed.executedAt).toBeInstanceOf(Date);
    });

    it('keeps the execution date on later transitions', async () => {
      const executedAt = new Date('2026-01-01T00:00:00.000Z');
      entityManager.find.mockResolvedValue([buildStoredOrder(1, HealthOrderStatus.EXECUTED, { executedAt })]);

      const [updated] = await repository.bulkUpdateHealthOrderStatus([1], HealthOrderStatus.PENDING_RESULTS);

      expect(updated.executedAt).toBe(executedAt);
    });

    it('updates nothing and reports every missing ID when some orders do not exist', async () => {
      entityManager.find.mockResolvedValue([buildStoredOrder(2, HealthOrderStatus.QUOTED)]);

      const error = await getThrown(repository.bulkUpdateHealthOrderStatus([5, 2, 9], HealthOrderStatus.EXECUTED));

      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(error.getResponse()).toMatchObject({
        code: 'NOT_FOUND_ERROR',
        details: { missingIds: [5, 9] },
      });
      expect(entityManager.save).not.toHaveBeenCalled();
    });

    it('updates nothing and reports the orders that cannot make the transition', async () => {
      entityManager.find.mockResolvedValue([
        buildStoredOrder(1, HealthOrderStatus.QUOTED),
        buildStoredOrder(2, HealthOrderStatus.EXECUTED),
        buildStoredOrder(3, HealthOrderStatus.RESULTS_DONE),
      ]);

      const error = await getThrown(
        repository.bulkUpdateHealthOrderStatus([1, 2, 3], HealthOrderStatus.PENDING_RESULTS),
      );

      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.getResponse()).toMatchObject({
        code: 'INCORRECT_STATUS_ERROR',
        message: "Only health orders in 'executed' status can move to 'pending_results'",
        details: {
          requiredCurrentStatus: HealthOrderStatus.EXECUTED,
          invalidOrders: [
            { id: 1, currentStatus: HealthOrderStatus.QUOTED },
            { id: 3, currentStatus: HealthOrderStatus.RESULTS_DONE },
          ],
        },
      });
      expect(entityManager.save).not.toHaveBeenCalled();
    });

    it('rejects any order when the target status is the initial one', async () => {
      entityManager.find.mockResolvedValue([buildStoredOrder(1, HealthOrderStatus.EXECUTED)]);

      const error = await getThrown(repository.bulkUpdateHealthOrderStatus([1], HealthOrderStatus.QUOTED));

      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.getResponse()).toMatchObject({
        message: "No health order can move to 'quoted'",
        details: { requiredCurrentStatus: undefined },
      });
      expect(entityManager.save).not.toHaveBeenCalled();
    });

    it('reports the missing orders before the invalid transitions', async () => {
      entityManager.find.mockResolvedValue([buildStoredOrder(1, HealthOrderStatus.RESULTS_DONE)]);

      const error = await getThrown(repository.bulkUpdateHealthOrderStatus([1, 2], HealthOrderStatus.EXECUTED));

      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('propagates a failing save so the transaction is rolled back', async () => {
      entityManager.find.mockResolvedValue([buildStoredOrder(1, HealthOrderStatus.QUOTED)]);
      entityManager.save.mockRejectedValue(new Error('db down'));

      await expect(repository.bulkUpdateHealthOrderStatus([1], HealthOrderStatus.EXECUTED)).rejects.toThrow('db down');
    });
  });

  describe('attachHealthOrderFile', () => {
    const fileMetadata = {
      mimeType: 'application/pdf',
      storedFileName: '3f2c1b7e-0d44-4a53-9a39-0f6a2f6a8c11.pdf',
      originalName: 'order.pdf',
      sizeBytes: 4,
      checksumSha256: 'a'.repeat(64),
      fileType: HealthOrderFileType.HEALTH_ORDER_RESULT,
      additionalNotes: 'notes',
    };

    it('saves the file metadata referencing the order without loading other files', async () => {
      ormRepository.save.mockImplementation(async file => Object.assign(file, { id: 'file-id' }));

      const fileId = await repository.attachHealthOrderFile(7, fileMetadata);

      expect(fileId).toBe('file-id');
      expect(dataSource.getRepository).toHaveBeenCalledWith(HealthOrderFile);
      expect(ormRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ healthOrder: { id: 7 }, ...fileMetadata }),
      );
      expect(entityManager.findOne).not.toHaveBeenCalled();
    });

    it('defaults the file type to prescription', async () => {
      ormRepository.save.mockImplementation(async file => Object.assign(file, { id: 'file-id' }));

      await repository.attachHealthOrderFile(7, { ...fileMetadata, fileType: undefined });

      expect(ormRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ fileType: HealthOrderFileType.HEALTH_ORDER_PRESCRIPTION }),
      );
    });
  });

  describe('findHealthOrderFiles', () => {
    it('returns the files of the order sorted by creation date', async () => {
      const files = [new HealthOrderFile()];
      ormRepository.find.mockResolvedValue(files);

      await expect(repository.findHealthOrderFiles(7)).resolves.toBe(files);
      expect(dataSource.getRepository).toHaveBeenCalledWith(HealthOrderFile);
      expect(ormRepository.find).toHaveBeenCalledWith({
        where: { healthOrder: { id: 7 } },
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('findHealthOrderFile', () => {
    it('looks the file up by ID restricted to the order', async () => {
      const file = new HealthOrderFile();
      ormRepository.findOne.mockResolvedValue(file);

      await expect(repository.findHealthOrderFile(7, 'file-id')).resolves.toBe(file);
      expect(ormRepository.findOne).toHaveBeenCalledWith({ where: { id: 'file-id', healthOrder: { id: 7 } } });
    });

    it('returns null when the file belongs to another order', async () => {
      ormRepository.findOne.mockResolvedValue(null);

      await expect(repository.findHealthOrderFile(8, 'file-id')).resolves.toBeNull();
    });
  });

  describe('deleteHealthOrderFile', () => {
    const buildFile = () =>
      Object.assign(new HealthOrderFile(), {
        id: 'file-id',
        storedFileName: '3f2c1b7e-0d44-4a53-9a39-0f6a2f6a8c11.pdf',
        fileType: HealthOrderFileType.HEALTH_ORDER_RESULT,
      });

    it('locks the file of the order, deletes its record and returns it', async () => {
      const file = buildFile();
      entityManager.findOne.mockResolvedValue(file);

      await expect(repository.deleteHealthOrderFile(7, 'file-id')).resolves.toBe(file);

      expect(entityManager.findOne).toHaveBeenCalledWith(HealthOrderFile, {
        where: { id: 'file-id', healthOrder: { id: 7 } },
        lock: { mode: 'pessimistic_write' },
      });
      expect(entityManager.delete).toHaveBeenCalledWith(HealthOrderFile, { id: 'file-id' });
    });

    it('returns null and deletes nothing when the order has no such file', async () => {
      entityManager.findOne.mockResolvedValue(null);

      await expect(repository.deleteHealthOrderFile(7, 'file-id')).resolves.toBeNull();
      expect(entityManager.delete).not.toHaveBeenCalled();
    });

    it('propagates a failing delete so the transaction is rolled back', async () => {
      entityManager.findOne.mockResolvedValue(buildFile());
      entityManager.delete.mockRejectedValue(new Error('db down'));

      await expect(repository.deleteHealthOrderFile(7, 'file-id')).rejects.toThrow('db down');
    });
  });
});

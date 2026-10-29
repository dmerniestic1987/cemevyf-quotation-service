import { HttpStatus } from '@nestjs/common';
import { createHash } from 'crypto';
import { Readable } from 'stream';
import { HealthOrderService } from './health-order.service';
import { HealthOrder } from './health-order.entity';
import { HealthOrderItem } from './health-order-item.entity';
import { HealthOrderStatus } from './types/health-order-status';
import { HealthOrderFileType } from './types/health-order-file-type';
import { Client } from '../clients/client.entity';
import { HealthOrderFile } from './health-order-file.entity';
import { CurrencyEnum } from '../commons/types/currency.enum';

const CLIENT_ID = '14e7b437-3c5c-44a6-8d99-a0fab3ef6c40';
const CREATED_AT = new Date('2026-10-24T00:00:00.000Z');

const buildClient = (overrides: Partial<Client> = {}): Client =>
  Object.assign(new Client(), { id: CLIENT_ID, firstName: 'Diego', lastName: 'Rossi', email: 'a@b.com' }, overrides);

const buildHealthOrder = (overrides: Partial<HealthOrder> = {}): HealthOrder =>
  Object.assign(
    new HealthOrder(),
    {
      id: 7,
      status: HealthOrderStatus.QUOTED,
      currency: CurrencyEnum.ARS,
      totalAmount: '100.00',
      createdAt: CREATED_AT,
      healthOrderItems: [],
    },
    overrides,
  );

const PDF_CONTENT = Buffer.from('%PDF-1.4 test');
const PDF_SHA256 = createHash('sha256').update(PDF_CONTENT).digest('hex');
const STORED_FILE_NAME = '3f2c1b7e-0d44-4a53-9a39-0f6a2f6a8c11.pdf';

const buildFile = (): Express.Multer.File =>
  ({ originalname: 'order.pdf', mimetype: 'application/pdf', buffer: PDF_CONTENT }) as Express.Multer.File;

describe('HealthOrderService', () => {
  let healthOrderRepository: Record<string, jest.Mock>;
  let clientsRepository: { findOne: jest.Mock };
  let messageService: { sendMail: jest.Mock };
  let fileStorage: { save: jest.Mock; createReadStream: jest.Mock; delete: jest.Mock };
  let service: HealthOrderService;

  beforeEach(() => {
    healthOrderRepository = {
      createHealthOrder: jest.fn(async (healthOrder: HealthOrder) =>
        Object.assign(healthOrder, { id: 7, createdAt: CREATED_AT }),
      ),
      updateHealthOrder: jest.fn(async (healthOrder: HealthOrder) => healthOrder),
      getHealthOrderAndFail: jest.fn(),
      updateHealthOrderStatus: jest.fn(),
      bulkUpdateHealthOrderStatus: jest.fn(),
      attachHealthOrderFile: jest.fn(async () => 'file-id'),
      findHealthOrderFiles: jest.fn(),
      findHealthOrderFile: jest.fn(),
      deleteHealthOrderFile: jest.fn(),
      getRepository: jest.fn(),
    };
    clientsRepository = { findOne: jest.fn() };
    messageService = { sendMail: jest.fn(async () => true) };
    fileStorage = {
      save: jest.fn(async () => STORED_FILE_NAME),
      createReadStream: jest.fn(),
      delete: jest.fn(async () => undefined),
    };
    service = new HealthOrderService(
      healthOrderRepository as any,
      clientsRepository as any,
      messageService as any,
      fileStorage,
    );
  });

  describe('create', () => {
    const createDto = {
      clientId: CLIENT_ID,
      currency: CurrencyEnum.USD,
      quotationItems: [
        { code: 'A', name: 'a', unitPrice: '0.10', itemCount: 3 },
        { name: 'b', unitPrice: '37500.50', itemCount: 2 },
      ],
    };

    it('computes the total amount on the server and sends the e-mail', async () => {
      clientsRepository.findOne.mockResolvedValue(buildClient());

      const result = await service.create(createDto);

      const savedOrder: HealthOrder = healthOrderRepository.createHealthOrder.mock.calls[0][0];
      expect(savedOrder.totalAmount).toBe(75001.3);
      expect(savedOrder.currency).toBe(CurrencyEnum.USD);
      expect(savedOrder.healthOrderItems.map(item => [item.id, item.unitPrice, item.itemCount])).toEqual([
        [0, 0.1, 3],
        [1, 37500.5, 2],
      ]);
      expect(savedOrder.healthOrderItems.every(item => item.healthOrder === savedOrder)).toBe(true);
      expect(messageService.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@b.com' }));
      expect(result).toMatchObject({ id: 7, totalAmount: 75001.3, sentMail: true });
      expect(result.items.map(item => item.totalPrice)).toEqual(['0.30', '75001.00']);
    });

    it('does not send an e-mail when the client has none', async () => {
      clientsRepository.findOne.mockResolvedValue(buildClient({ email: null }));

      const result = await service.create(createDto);

      expect(messageService.sendMail).not.toHaveBeenCalled();
      expect(result.sentMail).toBe(false);
    });

    it('throws not found when the client does not exist', async () => {
      clientsRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
      expect(healthOrderRepository.createHealthOrder).not.toHaveBeenCalled();
    });
  });

  describe('findOrders', () => {
    const pageOptions = { page: 2, take: 10 };
    let ormRepository: { findAndCount: jest.Mock };

    beforeEach(() => {
      ormRepository = { findAndCount: jest.fn(async () => [[buildHealthOrder({ client: buildClient() })], 11]) };
      healthOrderRepository.getRepository.mockReturnValue(ormRepository);
    });

    const getFindOptions = () => ormRepository.findAndCount.mock.calls[0][0];

    it('builds the filter with ID, date range and currency and paginates the result', async () => {
      const result = await service.findOrders(
        { id: 3, dateFrom: '2026-01-01', dateTo: '2026-02-01', currency: CurrencyEnum.ARS },
        pageOptions,
      );

      expect(getFindOptions()).toMatchObject({
        where: { id: 3, currency: CurrencyEnum.ARS },
        skip: 10,
        take: 10,
        relations: { client: true },
      });
      expect(getFindOptions().where.createdAt.type).toBe('and');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].client).toMatchObject({ id: CLIENT_ID });
      expect(result.meta).toMatchObject({ itemCount: 11, page: 2, hasPreviousPage: true });
    });

    it.each(Object.values(HealthOrderStatus))('filters by the %p status', async status => {
      await service.findOrders({ status }, pageOptions);

      expect(getFindOptions().where).toEqual({ status });
    });

    it('combines the status with the other filters', async () => {
      await service.findOrders({ id: 3, currency: CurrencyEnum.USD, status: HealthOrderStatus.EXECUTED }, pageOptions);

      expect(getFindOptions().where).toEqual({ id: 3, currency: CurrencyEnum.USD, status: HealthOrderStatus.EXECUTED });
    });

    it.each([
      [{ dateFrom: '2026-01-01' }, 'moreThanOrEqual'],
      [{ dateTo: '2026-02-01' }, 'lessThanOrEqual'],
    ])('builds an open date range for %p', async (filter, operatorType) => {
      await service.findOrders(filter, pageOptions);

      expect(getFindOptions().where.createdAt.type).toBe(operatorType);
    });

    it('filters by the ID of the client', async () => {
      await service.findOrders({ clientId: CLIENT_ID }, pageOptions);

      expect(getFindOptions()).toMatchObject({ where: { client: { id: CLIENT_ID } }, relations: { client: true } });
    });

    it('combines the client with the other filters', async () => {
      await service.findOrders({ clientId: CLIENT_ID, status: HealthOrderStatus.QUOTED }, pageOptions);

      expect(getFindOptions().where).toEqual({ client: { id: CLIENT_ID }, status: HealthOrderStatus.QUOTED });
    });

    it('uses an empty filter when nothing is provided', async () => {
      await service.findOrders({}, pageOptions);

      expect(getFindOptions().where).toEqual({});
    });
  });

  describe('findOrder', () => {
    it('returns the mapped health order', async () => {
      healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(buildHealthOrder());

      await expect(service.findOrder(7)).resolves.toMatchObject({ id: 7, totalAmount: 100 });
    });
  });

  describe('update', () => {
    it('replaces the items and recomputes the total amount', async () => {
      const healthOrder = buildHealthOrder();
      healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(healthOrder);

      const result = await service.update(7, {
        orderItems: [
          { name: 'd', unitPrice: '200', itemCount: 2 },
          { name: 'e', unitPrice: '1.5', itemCount: 1 },
        ],
      });

      expect(healthOrderRepository.updateHealthOrder).toHaveBeenCalledWith(healthOrder, true);
      expect(healthOrder.totalAmount).toBe(401.5);
      expect(healthOrder.healthOrderItems.map(item => [item.id, item.orderId])).toEqual([
        [0, 7],
        [1, 7],
      ]);
      expect(result.totalAmount).toBe(401.5);
    });

    it('updates only the currency and keeps the items and total', async () => {
      const items = [Object.assign(new HealthOrderItem(), { id: 0, name: 'x', unitPrice: '100.00', itemCount: 1 })];
      const healthOrder = buildHealthOrder({ healthOrderItems: items });
      healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(healthOrder);

      await service.update(7, { currency: CurrencyEnum.USD });

      expect(healthOrderRepository.updateHealthOrder).toHaveBeenCalledWith(healthOrder, false);
      expect(healthOrder.currency).toBe(CurrencyEnum.USD);
      expect(healthOrder.healthOrderItems).toBe(items);
      expect(healthOrder.totalAmount).toBe('100.00');
    });
  });

  describe('updateHealthOrderStatus', () => {
    it('delegates the transition to the repository', async () => {
      healthOrderRepository.updateHealthOrderStatus.mockResolvedValue(
        buildHealthOrder({ status: HealthOrderStatus.EXECUTED }),
      );

      const result = await service.updateHealthOrderStatus(7, HealthOrderStatus.EXECUTED);

      expect(healthOrderRepository.updateHealthOrderStatus).toHaveBeenCalledWith(7, HealthOrderStatus.EXECUTED);
      expect(result.status).toBe(HealthOrderStatus.EXECUTED);
    });
  });

  describe('bulkUpdateHealthOrderStatus', () => {
    it('delegates to the repository and maps every order keeping the requested order', async () => {
      healthOrderRepository.bulkUpdateHealthOrderStatus.mockResolvedValue([
        buildHealthOrder({ id: 3, status: HealthOrderStatus.PENDING_RESULTS }),
        buildHealthOrder({ id: 1, status: HealthOrderStatus.PENDING_RESULTS }),
      ]);

      const result = await service.bulkUpdateHealthOrderStatus([3, 1], HealthOrderStatus.PENDING_RESULTS);

      expect(healthOrderRepository.bulkUpdateHealthOrderStatus).toHaveBeenCalledWith(
        [3, 1],
        HealthOrderStatus.PENDING_RESULTS,
      );
      expect(result.map(order => [order.id, order.status])).toEqual([
        [3, HealthOrderStatus.PENDING_RESULTS],
        [1, HealthOrderStatus.PENDING_RESULTS],
      ]);
    });

    it('does not report the array index as the e-mail sent flag', async () => {
      healthOrderRepository.bulkUpdateHealthOrderStatus.mockResolvedValue([buildHealthOrder(), buildHealthOrder()]);

      const result = await service.bulkUpdateHealthOrderStatus([1, 2], HealthOrderStatus.EXECUTED);

      expect(result.map(order => order.sentMail)).toEqual([undefined, undefined]);
    });

    it('propagates the repository errors', async () => {
      healthOrderRepository.bulkUpdateHealthOrderStatus.mockRejectedValue(
        Object.assign(new Error(), { status: HttpStatus.NOT_FOUND }),
      );

      await expect(service.bulkUpdateHealthOrderStatus([1], HealthOrderStatus.EXECUTED)).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });
  });

  describe('attachHealthOrderPrescription', () => {
    it('stores the file on disk and registers only its metadata', async () => {
      healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(buildHealthOrder());

      await expect(service.attachHealthOrderPrescription(7, buildFile(), 'notes')).resolves.toBe('file-id');
      expect(fileStorage.save).toHaveBeenCalledWith(PDF_CONTENT, '.pdf');
      expect(healthOrderRepository.attachHealthOrderFile).toHaveBeenCalledWith(7, {
        mimeType: 'application/pdf',
        storedFileName: STORED_FILE_NAME,
        originalName: 'order.pdf',
        sizeBytes: PDF_CONTENT.length,
        checksumSha256: PDF_SHA256,
        additionalNotes: 'notes',
        fileType: HealthOrderFileType.HEALTH_ORDER_PRESCRIPTION,
      });
      expect(fileStorage.delete).not.toHaveBeenCalled();
    });

    it.each([HealthOrderStatus.QUOTED, HealthOrderStatus.EXECUTED, HealthOrderStatus.PENDING_RESULTS])(
      'attaches the prescription when the order is %p',
      async status => {
        healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(buildHealthOrder({ status }));

        await expect(service.attachHealthOrderPrescription(7, buildFile(), 'notes')).resolves.toBe('file-id');
      },
    );

    it('rejects when the results are already done without touching the disk', async () => {
      healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(
        buildHealthOrder({ status: HealthOrderStatus.RESULTS_DONE }),
      );

      await expect(service.attachHealthOrderPrescription(7, buildFile(), 'notes')).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
      expect(fileStorage.save).not.toHaveBeenCalled();
      expect(healthOrderRepository.attachHealthOrderFile).not.toHaveBeenCalled();
    });

    it('removes the stored file and rethrows when the database insert fails', async () => {
      healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(buildHealthOrder());
      healthOrderRepository.attachHealthOrderFile.mockRejectedValue(new Error('db down'));

      await expect(service.attachHealthOrderPrescription(7, buildFile(), 'notes')).rejects.toThrow('db down');
      expect(fileStorage.delete).toHaveBeenCalledWith(STORED_FILE_NAME);
    });

    it('rethrows the original error even when removing the stored file also fails', async () => {
      healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(buildHealthOrder());
      healthOrderRepository.attachHealthOrderFile.mockRejectedValue(new Error('db down'));
      fileStorage.delete.mockRejectedValue(new Error('disk error'));

      await expect(service.attachHealthOrderPrescription(7, buildFile(), 'notes')).rejects.toThrow('db down');
      expect(fileStorage.delete).toHaveBeenCalledWith(STORED_FILE_NAME);
    });
  });

  describe('attachResultFile', () => {
    it.each([HealthOrderStatus.QUOTED, HealthOrderStatus.EXECUTED, HealthOrderStatus.PENDING_RESULTS])(
      'attaches the file as a result when the order is %p',
      async status => {
        healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(buildHealthOrder({ status }));

        await expect(service.attachResultFile(7, buildFile(), undefined)).resolves.toBe('file-id');
        expect(healthOrderRepository.attachHealthOrderFile).toHaveBeenCalledWith(
          7,
          expect.objectContaining({ fileType: HealthOrderFileType.HEALTH_ORDER_RESULT }),
        );
      },
    );

    it('rejects when the results are already done without touching the disk', async () => {
      healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(
        buildHealthOrder({ status: HealthOrderStatus.RESULTS_DONE }),
      );

      await expect(service.attachResultFile(7, buildFile(), undefined)).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        response: { code: 'INCORRECT_STATUS_ERROR' },
      });
      expect(fileStorage.save).not.toHaveBeenCalled();
      expect(healthOrderRepository.attachHealthOrderFile).not.toHaveBeenCalled();
    });
  });

  describe('findOrderFiles', () => {
    it('returns the metadata of the attached files', async () => {
      healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(buildHealthOrder());
      healthOrderRepository.findHealthOrderFiles.mockResolvedValue([
        Object.assign(new HealthOrderFile(), {
          id: 'file-id',
          fileType: HealthOrderFileType.HEALTH_ORDER_RESULT,
          originalName: 'order.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 13,
          additionalNotes: null,
          storedFileName: STORED_FILE_NAME,
          createdAt: CREATED_AT,
        }),
      ]);

      await expect(service.findOrderFiles(7)).resolves.toEqual([
        {
          id: 'file-id',
          fileType: HealthOrderFileType.HEALTH_ORDER_RESULT,
          originalName: 'order.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 13,
          additionalNotes: undefined,
          createdAt: CREATED_AT.toISOString(),
        },
      ]);
    });

    it('throws not found when the order does not exist', async () => {
      healthOrderRepository.getHealthOrderAndFail.mockRejectedValue(
        Object.assign(new Error(), { status: HttpStatus.NOT_FOUND }),
      );

      await expect(service.findOrderFiles(7)).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
      expect(healthOrderRepository.findHealthOrderFiles).not.toHaveBeenCalled();
    });
  });

  describe('downloadOrderFile', () => {
    it('opens the stored file and returns its metadata', async () => {
      const stream = Readable.from([PDF_CONTENT]);
      healthOrderRepository.findHealthOrderFile.mockResolvedValue(
        Object.assign(new HealthOrderFile(), {
          storedFileName: STORED_FILE_NAME,
          mimeType: 'application/pdf',
          originalName: 'order.pdf',
          sizeBytes: 13,
        }),
      );
      fileStorage.createReadStream.mockResolvedValue(stream);

      await expect(service.downloadOrderFile(7, 'file-id')).resolves.toEqual({
        stream,
        mimeType: 'application/pdf',
        originalName: 'order.pdf',
        sizeBytes: 13,
      });
      expect(healthOrderRepository.findHealthOrderFile).toHaveBeenCalledWith(7, 'file-id');
      expect(fileStorage.createReadStream).toHaveBeenCalledWith(STORED_FILE_NAME);
    });

    it('throws not found when the file does not belong to the order', async () => {
      healthOrderRepository.findHealthOrderFile.mockResolvedValue(null);

      await expect(service.downloadOrderFile(7, 'file-id')).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
      expect(fileStorage.createReadStream).not.toHaveBeenCalled();
    });
  });

  describe('deleteOrderFile', () => {
    const deletedFile = () =>
      Object.assign(new HealthOrderFile(), {
        id: 'file-id',
        fileType: HealthOrderFileType.HEALTH_ORDER_RESULT,
        storedFileName: STORED_FILE_NAME,
        checksumSha256: PDF_SHA256,
      });

    it.each([HealthOrderStatus.QUOTED, HealthOrderStatus.PENDING_RESULTS])(
      'deletes the record and then the stored file when the order is %p',
      async status => {
        const calls: string[] = [];
        healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(buildHealthOrder({ status }));
        healthOrderRepository.deleteHealthOrderFile.mockImplementation(async () => {
          calls.push('record');
          return deletedFile();
        });
        fileStorage.delete.mockImplementation(async () => {
          calls.push('file');
        });

        await expect(service.deleteOrderFile(7, 'file-id')).resolves.toBeUndefined();

        expect(healthOrderRepository.deleteHealthOrderFile).toHaveBeenCalledWith(7, 'file-id');
        expect(fileStorage.delete).toHaveBeenCalledWith(STORED_FILE_NAME);
        expect(calls).toEqual(['record', 'file']);
      },
    );

    it.each([HealthOrderStatus.EXECUTED, HealthOrderStatus.RESULTS_DONE])(
      'rejects the deletion when the order is %p without touching the record or the disk',
      async status => {
        healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(buildHealthOrder({ status }));

        await expect(service.deleteOrderFile(7, 'file-id')).rejects.toMatchObject({
          status: HttpStatus.BAD_REQUEST,
          response: {
            code: 'INCORRECT_STATUS_ERROR',
            message: "Files can only be deleted from health orders in 'quoted' or 'pending_results' status",
          },
        });
        expect(healthOrderRepository.deleteHealthOrderFile).not.toHaveBeenCalled();
        expect(fileStorage.delete).not.toHaveBeenCalled();
      },
    );

    it('throws not found when the order does not exist', async () => {
      healthOrderRepository.getHealthOrderAndFail.mockRejectedValue(
        Object.assign(new Error(), { status: HttpStatus.NOT_FOUND }),
      );

      await expect(service.deleteOrderFile(7, 'file-id')).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
      expect(healthOrderRepository.deleteHealthOrderFile).not.toHaveBeenCalled();
      expect(fileStorage.delete).not.toHaveBeenCalled();
    });

    it('throws not found and does not touch the disk when the file does not belong to the order', async () => {
      healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(buildHealthOrder());
      healthOrderRepository.deleteHealthOrderFile.mockResolvedValue(null);

      await expect(service.deleteOrderFile(7, 'file-id')).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
      expect(fileStorage.delete).not.toHaveBeenCalled();
    });

    it('does not touch the disk when removing the record fails', async () => {
      healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(buildHealthOrder());
      healthOrderRepository.deleteHealthOrderFile.mockRejectedValue(new Error('db down'));

      await expect(service.deleteOrderFile(7, 'file-id')).rejects.toThrow('db down');
      expect(fileStorage.delete).not.toHaveBeenCalled();
    });

    it('succeeds and keeps going when the stored file cannot be removed, leaving only an orphan file', async () => {
      healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(buildHealthOrder());
      healthOrderRepository.deleteHealthOrderFile.mockResolvedValue(deletedFile());
      fileStorage.delete.mockRejectedValue(new Error('EACCES'));

      await expect(service.deleteOrderFile(7, 'file-id')).resolves.toBeUndefined();
      expect(fileStorage.delete).toHaveBeenCalledWith(STORED_FILE_NAME);
    });
  });
});

import { HttpStatus, NotImplementedException } from '@nestjs/common';
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
import { MessageChannelEnum } from '../commons/types/message-channel.enum';

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
      attachHealthOrderFile: jest.fn(async () => 'file-id'),
      findHealthOrderFiles: jest.fn(),
      findHealthOrderFile: jest.fn(),
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

    it.each([
      [{ dateFrom: '2026-01-01' }, 'moreThanOrEqual'],
      [{ dateTo: '2026-02-01' }, 'lessThanOrEqual'],
    ])('builds an open date range for %p', async (filter, operatorType) => {
      await service.findOrders(filter, pageOptions);

      expect(getFindOptions().where.createdAt.type).toBe(operatorType);
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

  describe('sendHealthOrderPrescriptionToClient', () => {
    it('sends the e-mail to the requested address', async () => {
      healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(buildHealthOrder({ client: buildClient() }));

      const result = await service.sendHealthOrderPrescriptionToClient(7, {
        channel: MessageChannelEnum.E_MAIL,
        eMail: 'other@b.com',
      });

      expect(healthOrderRepository.getHealthOrderAndFail).toHaveBeenCalledWith(7, {
        client: true,
        healthOrderItems: true,
      });
      expect(messageService.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'other@b.com' }));
      expect(result).toEqual({ id: 7, channel: MessageChannelEnum.E_MAIL, sentMail: true });
    });

    it('throws not implemented for other channels', async () => {
      await expect(
        service.sendHealthOrderPrescriptionToClient(7, { channel: MessageChannelEnum.WHATSAPP }),
      ).rejects.toMatchObject({ status: HttpStatus.NOT_IMPLEMENTED });
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
    it('attaches the file as a result when the order is executed', async () => {
      healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(
        buildHealthOrder({ status: HealthOrderStatus.EXECUTED }),
      );

      await expect(service.attachResultFile(7, buildFile(), undefined)).resolves.toBe('file-id');
      expect(healthOrderRepository.attachHealthOrderFile).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ fileType: HealthOrderFileType.HEALTH_ORDER_RESULT }),
      );
    });

    it('rejects when the order is not executed without touching the disk', async () => {
      healthOrderRepository.getHealthOrderAndFail.mockResolvedValue(buildHealthOrder());

      await expect(service.attachResultFile(7, buildFile(), undefined)).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
      expect(fileStorage.save).not.toHaveBeenCalled();
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

  describe('sendHealthOrderResultsToClient', () => {
    it('is not implemented yet', () => {
      expect(() => service.sendHealthOrderResultsToClient(7, { channel: MessageChannelEnum.E_MAIL })).toThrow(
        NotImplementedException,
      );
    });
  });
});

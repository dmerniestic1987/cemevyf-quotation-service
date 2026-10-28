import { StreamableFile } from '@nestjs/common';
import { Readable } from 'stream';
import { HealthOrderController } from './health-order.controller';
import { HealthOrderStatus } from './types/health-order-status';

describe('HealthOrderController', () => {
  let service: Record<string, jest.Mock>;
  let controller: HealthOrderController;
  const file = { originalname: 'order.pdf' } as Express.Multer.File;

  beforeEach(() => {
    service = {
      create: jest.fn(async () => 'created'),
      updateHealthOrderStatus: jest.fn(async () => 'status-updated'),
      findOrders: jest.fn(async () => 'page'),
      findOrder: jest.fn(async () => 'order'),
      update: jest.fn(async () => 'updated'),
      attachHealthOrderPrescription: jest.fn(async () => 'prescription-id'),
      attachResultFile: jest.fn(async () => 'result-id'),
      bulkUpdateHealthOrderStatus: jest.fn(async () => 'bulk-updated'),
      findOrderFiles: jest.fn(async () => 'files'),
      downloadOrderFile: jest.fn(),
      deleteOrderFile: jest.fn(async () => undefined),
    };
    controller = new HealthOrderController(service as any);
  });

  it('creates a health order', async () => {
    const dto = { clientId: 'id', quotationItems: [] };
    await expect(controller.create(dto)).resolves.toBe('created');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('updates the status', async () => {
    await expect(controller.updateHealthOrderStatus(7, { status: HealthOrderStatus.EXECUTED })).resolves.toBe(
      'status-updated',
    );
    expect(service.updateHealthOrderStatus).toHaveBeenCalledWith(7, HealthOrderStatus.EXECUTED);
  });

  it('uses the same query DTO as filter and pagination options', async () => {
    const query = { id: 3, page: 1, take: 10 };
    await expect(controller.findHealthOrders(query)).resolves.toBe('page');
    expect(service.findOrders).toHaveBeenCalledWith(query, query);
  });

  it('finds a health order', async () => {
    await expect(controller.findHealthOrder(7)).resolves.toBe('order');
    expect(service.findOrder).toHaveBeenCalledWith(7);
  });

  it('updates a health order', async () => {
    const dto = { currency: undefined };
    await expect(controller.updateHealthOrder(7, dto)).resolves.toBe('updated');
    expect(service.update).toHaveBeenCalledWith(7, dto);
  });

  it('attaches a prescription and returns the file ID with its original name', async () => {
    await expect(controller.attachHealthOrderPrescription(7, file, { additionalNotes: 'notes' })).resolves.toEqual({
      id: 'prescription-id',
      originalName: 'order.pdf',
    });
    expect(service.attachHealthOrderPrescription).toHaveBeenCalledWith(7, file, 'notes');
  });

  it('attaches a result and returns the file ID with its original name', async () => {
    await expect(controller.attachHealthOrderResult(7, file, {})).resolves.toEqual({
      id: 'result-id',
      originalName: 'order.pdf',
    });
    expect(service.attachResultFile).toHaveBeenCalledWith(7, file, undefined);
  });

  it('updates the status of several health orders at once', async () => {
    await expect(
      controller.bulkUpdateHealthOrderStatus({ ids: [1, 2, 3], status: HealthOrderStatus.PENDING_RESULTS }),
    ).resolves.toBe('bulk-updated');
    expect(service.bulkUpdateHealthOrderStatus).toHaveBeenCalledWith([1, 2, 3], HealthOrderStatus.PENDING_RESULTS);
  });

  it('lists the files of a health order', async () => {
    await expect(controller.findHealthOrderFiles(7)).resolves.toBe('files');
    expect(service.findOrderFiles).toHaveBeenCalledWith(7);
  });

  it('downloads a file streaming it with the stored headers', async () => {
    const stream = Readable.from(['content']);
    service.downloadOrderFile.mockResolvedValue({
      stream,
      mimeType: 'application/pdf',
      originalName: 'órden médica.pdf',
      sizeBytes: 7,
    });
    const response = { set: jest.fn() };

    const result = await controller.downloadHealthOrderFile(7, 'file-id', response as any);

    expect(service.downloadOrderFile).toHaveBeenCalledWith(7, 'file-id');
    expect(result).toBeInstanceOf(StreamableFile);
    expect(response.set).toHaveBeenCalledWith({
      'Content-Type': 'application/pdf',
      'Content-Length': '7',
      'Content-Disposition': "inline; filename*=UTF-8''%C3%B3rden%20m%C3%A9dica.pdf",
      'X-Content-Type-Options': 'nosniff',
    });
  });

  it('deletes a file of a health order and returns nothing', async () => {
    await expect(controller.deleteHealthOrderFile(7, 'file-id')).resolves.toBeUndefined();
    expect(service.deleteOrderFile).toHaveBeenCalledWith(7, 'file-id');
  });
});

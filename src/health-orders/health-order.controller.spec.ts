import { HealthOrderController } from './health-order.controller';
import { HealthOrderStatus } from './types/health-order-status';
import { MessageChannelEnum } from '../commons/types/message-channel.enum';

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
      sendHealthOrderPrescriptionToClient: jest.fn(async () => 'prescription-sent'),
      attachResultFile: jest.fn(async () => 'result-id'),
      sendHealthOrderResultsToClient: jest.fn(async () => 'results-sent'),
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

  it('sends the prescription e-mail', async () => {
    const dto = { channel: MessageChannelEnum.E_MAIL };
    await expect(controller.sendHealthOrderPrescriptionToClient(7, dto)).resolves.toBe('prescription-sent');
    expect(service.sendHealthOrderPrescriptionToClient).toHaveBeenCalledWith(7, dto);
  });

  it('attaches a result and returns the file ID with its original name', async () => {
    await expect(controller.attachHealthOrderResult(7, file, {})).resolves.toEqual({
      id: 'result-id',
      originalName: 'order.pdf',
    });
    expect(service.attachResultFile).toHaveBeenCalledWith(7, file, undefined);
  });

  it('sends the results e-mail', async () => {
    const dto = { channel: MessageChannelEnum.E_MAIL };
    await expect(controller.sendHealthOrderResultsToClient(7, dto)).resolves.toBe('results-sent');
    expect(service.sendHealthOrderResultsToClient).toHaveBeenCalledWith(7, dto);
  });
});

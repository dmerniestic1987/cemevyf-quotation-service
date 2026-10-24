import { ClientController } from './client.controller';

describe('ClientController', () => {
  let service: Record<string, jest.Mock>;
  let controller: ClientController;

  beforeEach(() => {
    service = {
      create: jest.fn(async () => 'created'),
      findClients: jest.fn(async () => 'page'),
      findOrder: jest.fn(async () => 'client'),
    };
    controller = new ClientController(service as any);
  });

  it('creates a client', async () => {
    const dto = { firstName: 'Diego', lastName: 'Rossi' };
    await expect(controller.createClient(dto)).resolves.toBe('created');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('uses the same query DTO as filter and pagination options', async () => {
    const query = { firstName: 'Diego', page: 1, take: 10 };
    await expect(controller.findClients(query)).resolves.toBe('page');
    expect(service.findClients).toHaveBeenCalledWith(query, query);
  });

  it('finds a client', async () => {
    await expect(controller.findClient('id')).resolves.toBe('client');
    expect(service.findOrder).toHaveBeenCalledWith('id');
  });
});

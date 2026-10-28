import { Role } from '../auth/types/role.enum';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  let service: Record<string, jest.Mock>;
  let controller: UsersController;

  beforeEach(() => {
    service = {
      create: jest.fn(async () => 'created'),
      findUsers: jest.fn(async () => 'page'),
      findUser: jest.fn(async () => 'user'),
      update: jest.fn(async () => 'updated'),
      resetPassword: jest.fn(async () => undefined),
    };
    controller = new UsersController(service as any);
  });

  it('creates a user', async () => {
    const dto = { username: 'maria', password: 'a-long-password', role: Role.SECRETARY };
    await expect(controller.createUser(dto)).resolves.toBe('created');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('uses the same query DTO as filter and pagination options', async () => {
    const query = { username: 'maria', page: 1, take: 10 };
    await expect(controller.findUsers(query)).resolves.toBe('page');
    expect(service.findUsers).toHaveBeenCalledWith(query, query);
  });

  it('finds a user', async () => {
    await expect(controller.findUser('id')).resolves.toBe('user');
    expect(service.findUser).toHaveBeenCalledWith('id');
  });

  it('updates a user on behalf of the current user', async () => {
    const currentUser = { id: 'admin', username: 'admin', role: Role.BUSINESS_ADMIN };
    await expect(controller.updateUser('id', { enabled: false }, currentUser)).resolves.toBe('updated');
    expect(service.update).toHaveBeenCalledWith('id', { enabled: false }, 'admin');
  });

  it('resets a password', async () => {
    await expect(controller.resetUserPassword('id', { newPassword: 'a-long-password' })).resolves.toBeUndefined();
    expect(service.resetPassword).toHaveBeenCalledWith('id', 'a-long-password');
  });
});

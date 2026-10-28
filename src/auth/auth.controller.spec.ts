import { AuthController } from './auth.controller';
import { Role } from './types/role.enum';

describe('AuthController', () => {
  let authService: Record<string, jest.Mock>;
  let usersService: Record<string, jest.Mock>;
  let controller: AuthController;
  const user = { id: 'id', username: 'maria', role: Role.SECRETARY };

  beforeEach(() => {
    authService = { login: jest.fn(async () => 'token') };
    usersService = { changeOwnPassword: jest.fn(async () => undefined) };
    controller = new AuthController(authService as any, usersService as any);
  });

  it('logs in', async () => {
    const dto = { username: 'maria', password: 'secret' };
    await expect(controller.login(dto, '10.0.0.1')).resolves.toBe('token');
    expect(authService.login).toHaveBeenCalledWith(dto, '10.0.0.1');
  });

  it('returns the user of the token', async () => {
    await expect(controller.me(user)).resolves.toBe(user);
  });

  it('changes the password of the user of the token', async () => {
    await expect(
      controller.changePassword(user, { currentPassword: 'old', newPassword: 'a-long-password' }),
    ).resolves.toBeUndefined();
    expect(usersService.changeOwnPassword).toHaveBeenCalledWith('id', 'old', 'a-long-password');
  });
});

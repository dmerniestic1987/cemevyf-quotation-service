import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { Role } from './types/role.enum';

const USER_ID = '14e7b437-3c5c-44a6-8d99-a0fab3ef6c40';

const buildUser = (overrides = {}) => ({
  id: USER_ID,
  username: 'maria',
  passwordHash: 'hash',
  role: Role.SECRETARY,
  enabled: true,
  tokenVersion: 2,
  ...overrides,
});

const catchError = async (promise: Promise<unknown>) =>
  promise.then(
    () => undefined,
    error => error,
  );

describe('AuthService', () => {
  let usersService: { findByUsername: jest.Mock };
  let passwordService: { verify: jest.Mock };
  let jwtService: JwtService;
  let service: AuthService;

  beforeEach(() => {
    usersService = { findByUsername: jest.fn(async () => buildUser()) };
    passwordService = { verify: jest.fn(async () => true) };
    jwtService = new JwtService({ secret: 'a'.repeat(32), signOptions: { algorithm: 'HS256', expiresIn: '8h' } });
    service = new AuthService(usersService as any, passwordService as any, jwtService);
  });

  it('logs in and issues a token that lasts the configured time', async () => {
    const result = await service.login({ username: 'maria', password: 'secret' }, '10.0.0.1');

    expect(passwordService.verify).toHaveBeenCalledWith('secret', 'hash');
    expect(result).toEqual({
      accessToken: expect.any(String),
      tokenType: 'Bearer',
      expiresIn: 8 * 60 * 60,
      user: { id: USER_ID, username: 'maria', role: Role.SECRETARY },
    });
    expect(jwtService.decode(result.accessToken)).toMatchObject({ sub: USER_ID, role: Role.SECRETARY, tv: 2 });
  });

  it('never puts the password hash in the token', async () => {
    const { accessToken } = await service.login({ username: 'maria', password: 'secret' });

    expect(JSON.stringify(jwtService.decode(accessToken))).not.toContain('hash');
  });

  it.each([
    ['unknown user', null, true],
    ['wrong password', buildUser(), false],
    ['disabled user with the right password', buildUser({ enabled: false }), true],
  ])('rejects %s with the same generic error', async (_, user, passwordMatches) => {
    usersService.findByUsername.mockResolvedValue(user);
    passwordService.verify.mockResolvedValue(passwordMatches);

    const error = await catchError(service.login({ username: 'maria', password: 'secret' }));

    expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(error.getResponse()).toEqual({ message: 'Invalid username or password', code: 'UNAUTHORIZED' });
  });

  it('checks the password even when the user does not exist', async () => {
    usersService.findByUsername.mockResolvedValue(null);

    await catchError(service.login({ username: 'ghost', password: 'secret' }));

    expect(passwordService.verify).toHaveBeenCalledWith('secret', undefined);
  });
});

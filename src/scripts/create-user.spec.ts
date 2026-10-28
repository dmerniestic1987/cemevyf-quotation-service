import { NestFactory } from '@nestjs/core';
import { Role } from '../auth/types/role.enum';
import { buildCreateUserDto, createUser, main, PASSWORD_ENV_VAR } from './create-user';

jest.mock('../app.module', () => ({ AppModule: class {} }));

const catchError = async (promise: Promise<unknown>) =>
  promise.then(
    () => undefined,
    error => error,
  );

describe('buildCreateUserDto', () => {
  const env = { [PASSWORD_ENV_VAR]: 'a-long-password' };

  it('uses the password given as the third argument and normalizes the username', async () => {
    const dto = await buildCreateUserDto([' Admin ', Role.BUSINESS_ADMIN, 'argument-password'], {});

    expect(dto).toMatchObject({ username: 'admin', role: Role.BUSINESS_ADMIN, password: 'argument-password' });
  });

  it('falls back to the password of the environment variable', async () => {
    const dto = await buildCreateUserDto(['admin', Role.SECRETARY], env);

    expect(dto.password).toBe('a-long-password');
  });

  it('prefers the argument over the environment variable', async () => {
    const dto = await buildCreateUserDto(['admin', Role.SECRETARY, 'argument-password'], env);

    expect(dto.password).toBe('argument-password');
  });

  it.each([
    ['no arguments', [], env],
    ['no role', ['admin'], env],
    ['no password', ['admin', Role.BUSINESS_ADMIN], {}],
  ])('prints the usage when there are %s', async (_, args, environment) => {
    await expect(buildCreateUserDto(args, environment)).rejects.toThrow('Usage: npm run -s user:create');
  });

  it('applies the same validation rules as the API', async () => {
    await expect(buildCreateUserDto(['admin', 'ROOT', 'a-long-password'], {})).rejects.toThrow('role');
    await expect(buildCreateUserDto(['admin', Role.SECRETARY, 'short'], {})).rejects.toThrow('at least 12 characters');
    await expect(buildCreateUserDto(['no spaces', Role.SECRETARY, 'a-long-password'], {})).rejects.toThrow('username');
  });

  it.each([
    ['an invalid role', ['admin', 'ROOT', 'secret-password-1']],
    ['an invalid username', ['no spaces', Role.SECRETARY, 'secret-password-1']],
    ['a password that is too short', ['admin', Role.SECRETARY, 'secret-1']],
    ['a password that is too long', ['admin', Role.SECRETARY, 'secret-password-1'.repeat(5)]],
    ['a missing role', ['admin']],
  ])('never includes the password in the error for %s', async (_, args) => {
    const password = args[2] ?? 'secret-password-1';
    const error = await catchError(buildCreateUserDto(args, { [PASSWORD_ENV_VAR]: password }));

    expect(error).toBeDefined();
    expect(error.message).not.toContain(password);
  });
});

describe('createUser', () => {
  it('creates the user and returns a message without the password', async () => {
    const usersService = { create: jest.fn(async dto => ({ id: 'id', username: dto.username, role: dto.role })) };
    const dto = await buildCreateUserDto(['admin', Role.BUSINESS_ADMIN, 'argument-password'], {});

    const message = await createUser(usersService as any, dto);

    expect(usersService.create).toHaveBeenCalledWith(dto);
    expect(message).toBe('User admin (BUSINESS_ADMIN) created with ID id');
    expect(message).not.toContain('argument-password');
  });
});

describe('main', () => {
  const originalArgv = process.argv;
  const originalPassword = process.env[PASSWORD_ENV_VAR];
  let usersService: { create: jest.Mock };
  let app: { get: jest.Mock; close: jest.Mock };
  let createApplicationContext: jest.SpyInstance;

  const printed = () =>
    JSON.stringify([(console.log as jest.Mock).mock.calls, (console.error as jest.Mock).mock.calls]);

  beforeEach(() => {
    usersService = { create: jest.fn(async dto => ({ id: 'id', username: dto.username, role: dto.role })) };
    app = { get: jest.fn(() => usersService), close: jest.fn(async () => undefined) };
    createApplicationContext = jest.spyOn(NestFactory, 'createApplicationContext').mockResolvedValue(app as any);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    process.env[PASSWORD_ENV_VAR] = 'env-long-password';
  });

  afterEach(() => {
    process.argv = originalArgv;
    if (originalPassword === undefined) {
      delete process.env[PASSWORD_ENV_VAR];
    } else {
      process.env[PASSWORD_ENV_VAR] = originalPassword;
    }
    process.exitCode = undefined;
    jest.restoreAllMocks();
  });

  it('creates the user from the command line arguments and closes the application', async () => {
    process.argv = ['node', 'create-user.js', 'admin', Role.BUSINESS_ADMIN, 'argument-password'];

    await main();

    expect(usersService.create).toHaveBeenCalledWith(expect.objectContaining({ password: 'argument-password' }));
    expect(console.log).toHaveBeenCalledWith('User admin (BUSINESS_ADMIN) created with ID id');
    expect(app.close).toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
  });

  it('takes the password from the environment when there is no argument', async () => {
    process.argv = ['node', 'create-user.js', 'admin', Role.BUSINESS_ADMIN];

    await main();

    expect(usersService.create).toHaveBeenCalledWith(expect.objectContaining({ password: 'env-long-password' }));
  });

  it('never prints the password, neither on success nor on failure', async () => {
    process.argv = ['node', 'create-user.js', 'admin', Role.BUSINESS_ADMIN, 'argument-password'];
    await main();
    usersService.create.mockRejectedValue({ response: { message: 'Username admin already exists' } });
    await main();
    process.argv = ['node', 'create-user.js', 'admin', Role.BUSINESS_ADMIN, 'short'];
    await main();

    expect(printed()).toContain('created with ID');
    expect(printed()).toContain('Username admin already exists');
    expect(printed()).not.toContain('argument-password');
    expect(printed()).not.toContain('short"');
  });

  it('validates the arguments before starting the application', async () => {
    process.argv = ['node', 'create-user.js', 'admin', 'ROOT', 'argument-password'];

    await main();

    expect(createApplicationContext).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('role'));
    expect(process.exitCode).toBe(1);
  });

  it('reports the error, fails the process and closes the application', async () => {
    process.argv = ['node', 'create-user.js', 'admin', Role.BUSINESS_ADMIN, 'argument-password'];
    usersService.create.mockRejectedValue({ response: { message: 'Username admin already exists' } });

    await main();

    expect(console.error).toHaveBeenCalledWith('Username admin already exists');
    expect(process.exitCode).toBe(1);
    expect(app.close).toHaveBeenCalled();
  });

  it('reports the error and fails the process when the application cannot start', async () => {
    process.argv = ['node', 'create-user.js', 'admin', Role.BUSINESS_ADMIN, 'argument-password'];
    createApplicationContext.mockRejectedValue(new Error('db down'));

    await main();

    expect(console.error).toHaveBeenCalledWith('db down');
    expect(process.exitCode).toBe(1);
  });
});

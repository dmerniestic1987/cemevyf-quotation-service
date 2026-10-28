import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Public } from '../decorators/public.decorator';
import { Role } from '../types/role.enum';
import { JwtAuthGuard } from './jwt-auth.guard';

type AnyFunction = (...args: any[]) => any;

const USER_ID = '14e7b437-3c5c-44a6-8d99-a0fab3ef6c40';
const SECRET = 'a'.repeat(32);
const OPTIONS = { issuer: 'issuer', audience: 'audience' };

class PublicController {
  @Public()
  open() {}
  closed() {}
}

const buildContext = (handler: AnyFunction, request: Record<string, any>): ExecutionContext =>
  ({
    getHandler: () => handler,
    getClass: () => PublicController,
    switchToHttp: () => ({ getRequest: () => request }),
  }) as any;

const catchError = async (promise: Promise<unknown>) =>
  promise.then(
    () => undefined,
    error => error,
  );

describe('JwtAuthGuard', () => {
  let usersService: { findById: jest.Mock };
  let jwtService: JwtService;
  let guard: JwtAuthGuard;

  const sign = (payload: object = { sub: USER_ID, role: Role.SECRETARY, tv: 1 }, options = {}) =>
    jwtService.signAsync(payload, { ...OPTIONS, ...options });

  const call = (headers: Record<string, string>, handler: AnyFunction = PublicController.prototype.closed) => {
    const request: Record<string, any> = { headers };
    return { request, result: guard.canActivate(buildContext(handler, request)) };
  };

  beforeEach(() => {
    usersService = {
      findById: jest.fn(async () => ({
        id: USER_ID,
        username: 'maria',
        role: Role.BUSINESS_ADMIN,
        enabled: true,
        tokenVersion: 1,
      })),
    };
    jwtService = new JwtService({
      secret: SECRET,
      signOptions: { algorithm: 'HS256', expiresIn: '8h' },
      verifyOptions: { algorithms: ['HS256'], ...OPTIONS },
    });
    guard = new JwtAuthGuard(new Reflector(), jwtService, usersService as any);
  });

  it('lets public endpoints through without a token', async () => {
    const { result } = call({}, PublicController.prototype.open);

    await expect(result).resolves.toBe(true);
    expect(usersService.findById).not.toHaveBeenCalled();
  });

  it('sets the user of the request from the database, not from the token claims', async () => {
    const { request, result } = call({ authorization: `Bearer ${await sign()}` });

    await expect(result).resolves.toBe(true);
    expect(request.user).toEqual({ id: USER_ID, username: 'maria', role: Role.BUSINESS_ADMIN });
  });

  it('accepts the Bearer scheme in any case', async () => {
    await expect(call({ authorization: `bearer ${await sign()}` }).result).resolves.toBe(true);
  });

  it.each([
    {},
    { authorization: '' },
    { authorization: 'Bearer' },
    { authorization: 'Basic abc' },
    { authorization: 'abc' },
  ])('rejects a request without a bearer token: %p', async headers => {
    const error = await catchError(call(headers).result);

    expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(error.getResponse()).toMatchObject({ message: 'Missing bearer token' });
  });

  it('rejects a token with another signature', async () => {
    const forged = await new JwtService({ secret: 'b'.repeat(32) }).signAsync({ sub: USER_ID, tv: 1 }, OPTIONS);

    expect((await catchError(call({ authorization: `Bearer ${forged}` }).result)).getStatus()).toBe(
      HttpStatus.UNAUTHORIZED,
    );
  });

  it('rejects an unsigned token', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ sub: USER_ID, tv: 1, ...OPTIONS })).toString('base64url');

    expect((await catchError(call({ authorization: `Bearer ${header}.${body}.` }).result)).getStatus()).toBe(
      HttpStatus.UNAUTHORIZED,
    );
  });

  it('rejects a token signed with another algorithm', async () => {
    const token = await sign(undefined, { algorithm: 'HS512' });

    expect((await catchError(call({ authorization: `Bearer ${token}` }).result)).getStatus()).toBe(
      HttpStatus.UNAUTHORIZED,
    );
  });

  it.each([{ issuer: 'other' }, { audience: 'other' }])('rejects a token with another %p', async override => {
    const token = await sign(undefined, override);

    expect((await catchError(call({ authorization: `Bearer ${token}` }).result)).getStatus()).toBe(
      HttpStatus.UNAUTHORIZED,
    );
  });

  it('rejects an expired token', async () => {
    const token = await sign(undefined, { expiresIn: -10 });

    const error = await catchError(call({ authorization: `Bearer ${token}` }).result);

    expect(error.getResponse()).toMatchObject({ message: 'Invalid or expired token' });
    expect(usersService.findById).not.toHaveBeenCalled();
  });

  it.each([
    ['does not exist', null],
    ['is disabled', { id: USER_ID, role: Role.SECRETARY, enabled: false, tokenVersion: 1 }],
    [
      'changed the password or the role since the token was issued',
      { id: USER_ID, role: Role.SECRETARY, enabled: true, tokenVersion: 2 },
    ],
  ])('rejects a token when the user %s', async (_, user) => {
    usersService.findById.mockResolvedValue(user);

    const { request, result } = call({ authorization: `Bearer ${await sign()}` });

    expect((await catchError(result)).getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(request.user).toBeUndefined();
  });
});

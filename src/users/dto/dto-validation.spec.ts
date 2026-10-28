import { ValidationPipe } from '@nestjs/common';
import { LoginRequestDto } from '../../auth/dto/login-request.dto';
import { ChangePasswordRequestDto } from '../../auth/dto/change-password-request.dto';
import { Role } from '../../auth/types/role.enum';
import { CreateUserRequestDto } from './create-user-request.dto';
import { FilterUserDto } from './filter-user.dto';
import { ResetPasswordRequestDto } from './reset-password-request.dto';
import { UpdateUserRequestDto } from './update-user-request.dto';

// Same options as the global pipe configured in main.ts
const validationPipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });

const run = (metatype: any, value: any, type: 'body' | 'query' = 'body') =>
  validationPipe.transform(value, { type, metatype });

const getErrors = async (metatype: any, value: any, type: 'body' | 'query' = 'body'): Promise<string[]> => {
  try {
    await run(metatype, value, type);
    return [];
  } catch (err) {
    return err.getResponse().message;
  }
};

const password = 'a-long-password';

describe('CreateUserRequestDto', () => {
  it('normalizes the username', async () => {
    const dto = await run(CreateUserRequestDto, { username: '  Maria.Lopez ', password, role: Role.SECRETARY });
    expect(dto.username).toBe('maria.lopez');
  });

  it.each(['ab', 'a'.repeat(51), 'maria lopez', 'maría', 'maria@x.com', '', 123])(
    'rejects the username %p',
    async username => {
      const errors = await getErrors(CreateUserRequestDto, { username, password, role: Role.SECRETARY });
      expect(errors.some(error => error.startsWith('username'))).toBe(true);
    },
  );

  it('rejects an unknown role', async () => {
    const errors = await getErrors(CreateUserRequestDto, { username: 'maria', password, role: 'ROOT' });
    expect(errors.some(error => error.startsWith('role'))).toBe(true);
  });

  it('rejects unknown properties', async () => {
    const errors = await getErrors(CreateUserRequestDto, {
      username: 'maria',
      password,
      role: Role.SECRETARY,
      enabled: false,
    });
    expect(errors).toContain('property enabled should not exist');
  });
});

describe('password rules', () => {
  it.each([
    ['too short', 'a'.repeat(11)],
    ['over 72 bytes', 'a'.repeat(73)],
    ['over 72 bytes with multi-byte characters', 'ñ'.repeat(37)],
  ])('rejects a password %s', async (_, value) => {
    for (const [metatype, body] of [
      [CreateUserRequestDto, { username: 'maria', password: value, role: Role.SECRETARY }],
      [ResetPasswordRequestDto, { newPassword: value }],
      [ChangePasswordRequestDto, { currentPassword: 'x', newPassword: value }],
    ] as const) {
      const errors = await getErrors(metatype, body);
      expect(errors.some(error => error.includes('at least 12 characters and at most 72 bytes'))).toBe(true);
    }
  });

  it('accepts passwords from 12 characters to 72 bytes', async () => {
    await expect(run(ResetPasswordRequestDto, { newPassword: 'a'.repeat(12) })).resolves.toBeDefined();
    await expect(run(ResetPasswordRequestDto, { newPassword: 'a'.repeat(72) })).resolves.toBeDefined();
    await expect(run(ResetPasswordRequestDto, { newPassword: 'ñ'.repeat(36) })).resolves.toBeDefined();
  });

  it('rejects a password that is not a string', async () => {
    expect(await getErrors(ResetPasswordRequestDto, { newPassword: 123456789012 })).not.toHaveLength(0);
  });
});

describe('UpdateUserRequestDto', () => {
  it('accepts a role, a status or both', async () => {
    await expect(run(UpdateUserRequestDto, { role: Role.BUSINESS_ADMIN })).resolves.toBeDefined();
    await expect(run(UpdateUserRequestDto, { enabled: false })).resolves.toBeDefined();
    await expect(run(UpdateUserRequestDto, {})).resolves.toBeDefined();
  });

  it('rejects invalid values', async () => {
    expect(await getErrors(UpdateUserRequestDto, { role: 'ROOT', enabled: 'no' })).toHaveLength(2);
  });
});

describe('FilterUserDto', () => {
  it('parses and normalizes the query', async () => {
    const dto = await run(
      FilterUserDto,
      { username: ' Maria ', role: Role.SECRETARY, enabled: 'false', page: '2' },
      'query',
    );
    expect(dto).toMatchObject({ username: 'maria', role: Role.SECRETARY, enabled: false, page: 2 });
    expect((await run(FilterUserDto, { enabled: 'true' }, 'query')).enabled).toBe(true);
  });

  it('rejects a status that is not a boolean', async () => {
    expect(await getErrors(FilterUserDto, { enabled: 'maybe' }, 'query')).not.toHaveLength(0);
  });
});

describe('LoginRequestDto', () => {
  it('normalizes the username and does not apply the password rules', async () => {
    const dto = await run(LoginRequestDto, { username: ' Maria ', password: 'x' });
    expect(dto).toMatchObject({ username: 'maria', password: 'x' });
  });

  it.each([
    { username: '', password: 'x' },
    { username: 'maria', password: '' },
    { username: 'a'.repeat(51), password: 'x' },
    { username: 'maria', password: 'x'.repeat(129) },
    { username: 'maria' },
  ])('rejects %p', async body => {
    expect(await getErrors(LoginRequestDto, body)).not.toHaveLength(0);
  });
});

describe('ChangePasswordRequestDto', () => {
  it('requires the current password', async () => {
    expect(await getErrors(ChangePasswordRequestDto, { newPassword: password })).not.toHaveLength(0);
    await expect(run(ChangePasswordRequestDto, { currentPassword: 'x', newPassword: password })).resolves.toBeDefined();
  });
});

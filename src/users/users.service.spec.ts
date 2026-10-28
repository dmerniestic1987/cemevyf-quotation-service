import { HttpStatus } from '@nestjs/common';
import { Role } from '../auth/types/role.enum';
import { User } from './user.entity';
import { UsersService } from './users.service';

const USER_ID = '14e7b437-3c5c-44a6-8d99-a0fab3ef6c40';
const ACTOR_ID = '24e7b437-3c5c-44a6-8d99-a0fab3ef6c41';

const buildUser = (overrides: Partial<User> = {}): User =>
  Object.assign(new User(), {
    id: USER_ID,
    username: 'maria',
    passwordHash: 'hash',
    role: Role.SECRETARY,
    enabled: true,
    tokenVersion: 3,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    ...overrides,
  });

const catchError = async (promise: Promise<unknown>) =>
  promise.then(
    () => undefined,
    error => error,
  );

describe('UsersService', () => {
  let repository: { findOne: jest.Mock; save: jest.Mock; findAndCount: jest.Mock };
  let passwordService: { hash: jest.Mock; verify: jest.Mock };
  let service: UsersService;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      save: jest.fn(async user => Object.assign(user, { id: USER_ID })),
      findAndCount: jest.fn(async () => [[buildUser()], 1]),
    };
    passwordService = { hash: jest.fn(async () => 'new-hash'), verify: jest.fn(async () => true) };
    service = new UsersService(repository as any, passwordService as any);
  });

  describe('create', () => {
    const dto = { username: 'maria', password: 'a-long-password', role: Role.SECRETARY };

    it('hashes the password and never returns it', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.create(dto);

      expect(passwordService.hash).toHaveBeenCalledWith('a-long-password');
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'maria',
          role: Role.SECRETARY,
          passwordHash: 'new-hash',
          enabled: true,
          tokenVersion: 0,
        }),
      );
      expect(result).toMatchObject({ id: USER_ID, username: 'maria', role: Role.SECRETARY, enabled: true });
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('tokenVersion');
    });

    it('rejects a username that already exists', async () => {
      repository.findOne.mockResolvedValue(buildUser());

      const error = await catchError(service.create(dto));

      expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it.each([{ driverError: { code: 'ER_DUP_ENTRY' } }, { code: 'ER_DUP_ENTRY' }])(
      'translates a duplicate key error raised by a concurrent request: %p',
      async dbError => {
        repository.findOne.mockResolvedValue(null);
        repository.save.mockRejectedValue(dbError);

        const error = await catchError(service.create(dto));

        expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
      },
    );

    it('rethrows any other database error', async () => {
      repository.findOne.mockResolvedValue(null);
      const dbError = new Error('connection lost');
      repository.save.mockRejectedValue(dbError);

      await expect(service.create(dto)).rejects.toBe(dbError);
    });
  });

  describe('findUsers', () => {
    it('filters the users and paginates', async () => {
      const result = await service.findUsers(
        { username: 'mar', role: Role.SECRETARY, enabled: false, page: 2, take: 5 },
        { page: 2, take: 5 },
      );

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { username: expect.objectContaining({ _value: '%mar%' }), role: Role.SECRETARY, enabled: false },
          skip: 5,
          take: 5,
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).not.toHaveProperty('passwordHash');
    });

    it('does not filter when there are no criteria', async () => {
      await service.findUsers({}, { page: 1, take: 10 });

      expect(repository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });
  });

  describe('findUser', () => {
    it('returns the user without the password hash', async () => {
      repository.findOne.mockResolvedValue(buildUser());

      const result = await service.findUser(USER_ID);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: USER_ID } });
      expect(result).toEqual({
        id: USER_ID,
        username: 'maria',
        role: Role.SECRETARY,
        enabled: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      });
    });

    it('fails when the user does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      expect((await catchError(service.findUser(USER_ID))).getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });

  it('finds the entity by username for the authentication', async () => {
    const user = buildUser();
    repository.findOne.mockResolvedValue(user);

    await expect(service.findByUsername('maria')).resolves.toBe(user);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { username: 'maria' } });
  });

  describe('update', () => {
    it('changes the role and closes the open sessions', async () => {
      const user = buildUser();
      repository.findOne.mockResolvedValue(user);

      const result = await service.update(USER_ID, { role: Role.BUSINESS_ADMIN }, ACTOR_ID);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.BUSINESS_ADMIN, enabled: true, tokenVersion: 4 }),
      );
      expect(result.role).toBe(Role.BUSINESS_ADMIN);
    });

    it('disables the user and closes the open sessions', async () => {
      repository.findOne.mockResolvedValue(buildUser());

      const result = await service.update(USER_ID, { enabled: false }, ACTOR_ID);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.SECRETARY, enabled: false, tokenVersion: 4 }),
      );
      expect(result.enabled).toBe(false);
    });

    it('does not touch the user when nothing changes', async () => {
      repository.findOne.mockResolvedValue(buildUser());

      await service.update(USER_ID, { role: Role.SECRETARY, enabled: true }, ACTOR_ID);
      await service.update(USER_ID, {}, ACTOR_ID);

      expect(repository.save).not.toHaveBeenCalled();
    });

    it('does not let administrators change their own role or status', async () => {
      const error = await catchError(service.update(ACTOR_ID, { enabled: false }, ACTOR_ID));

      expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(repository.findOne).not.toHaveBeenCalled();
    });

    it('fails when the user does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      expect((await catchError(service.update(USER_ID, { enabled: false }, ACTOR_ID))).getStatus()).toBe(
        HttpStatus.NOT_FOUND,
      );
    });
  });

  describe('resetPassword', () => {
    it('stores the new hash and closes the open sessions', async () => {
      repository.findOne.mockResolvedValue(buildUser());

      await service.resetPassword(USER_ID, 'another-long-password');

      expect(passwordService.hash).toHaveBeenCalledWith('another-long-password');
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: 'new-hash', tokenVersion: 4 }),
      );
    });

    it('fails when the user does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      expect((await catchError(service.resetPassword(USER_ID, 'another-long-password'))).getStatus()).toBe(
        HttpStatus.NOT_FOUND,
      );
    });
  });

  describe('changeOwnPassword', () => {
    it('requires the current password', async () => {
      repository.findOne.mockResolvedValue(buildUser());

      await service.changeOwnPassword(USER_ID, 'current', 'another-long-password');

      expect(passwordService.verify).toHaveBeenCalledWith('current', 'hash');
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: 'new-hash', tokenVersion: 4 }),
      );
    });

    it('rejects a wrong current password with a 400, not a 401, so the client does not log the user out', async () => {
      repository.findOne.mockResolvedValue(buildUser());
      passwordService.verify.mockResolvedValue(false);

      const error = await catchError(service.changeOwnPassword(USER_ID, 'wrong', 'another-long-password'));

      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.getResponse()).toMatchObject({ code: 'INVALID_CURRENT_PASSWORD' });
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});

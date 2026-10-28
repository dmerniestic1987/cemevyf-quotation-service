import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcrypt';
import request from 'supertest';
import { ClientController } from '../clients/client.controller';
import { ClientService } from '../clients/client.service';
import { HealthOrderController } from '../health-orders/health-order.controller';
import { HealthOrderService } from '../health-orders/health-order.service';
import { PasswordService } from '../users/password.service';
import { UsersController } from '../users/users.controller';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { AuthConfigModule } from './auth-config.module';
import { AuthModule } from './auth.module';
import { Role } from './types/role.enum';

const PASSWORD = 'a-long-password';

interface FakeUser {
  id: string;
  username: string;
  passwordHash: string;
  role: Role;
  enabled: boolean;
  tokenVersion: number;
}

// Replaces the UsersModule so the real AuthModule (guards, JwtModule, throttler) can run without a database
const users: Record<string, FakeUser> = {};
const fakeUsersService = {
  findByUsername: jest.fn(
    async (username: string) => Object.values(users).find(user => user.username === username) ?? null,
  ),
  findById: jest.fn(async (id: string) => Object.values(users).find(user => user.id === id) ?? null),
  findUsers: jest.fn(async () => ({ data: [], meta: {} })),
  create: jest.fn(async dto => ({ id: 'new', ...dto })),
  changeOwnPassword: jest.fn(async () => undefined),
};

@Module({
  imports: [AuthConfigModule],
  controllers: [UsersController],
  providers: [{ provide: UsersService, useValue: fakeUsersService }, PasswordService],
  exports: [UsersService, PasswordService],
})
class FakeUsersModule {}

@Module({
  controllers: [ClientController, HealthOrderController],
  providers: [
    { provide: ClientService, useValue: { findClients: jest.fn(async () => ({ data: [] })) } },
    { provide: HealthOrderService, useValue: { findOrders: jest.fn(async () => ({ data: [] })) } },
  ],
})
class FakeBusinessModule {}

const createApp = async (): Promise<INestApplication> => {
  const moduleRef = await Test.createTestingModule({ imports: [AuthModule, FakeBusinessModule] })
    .overrideModule(UsersModule)
    .useModule(FakeUsersModule)
    .compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  return app.init();
};

describe('Authentication and authorization (HTTP)', () => {
  let app: INestApplication;

  const login = (username: string, password = PASSWORD) =>
    request(app.getHttpServer()).post('/auth/login').send({ username, password });

  const tokenOf = async (username: string): Promise<string> => (await login(username)).body.accessToken;

  beforeAll(async () => {
    const passwordHash = await hash(PASSWORD, 4);
    users.secretary = {
      id: 'secretary-id',
      username: 'maria',
      passwordHash,
      role: Role.SECRETARY,
      enabled: true,
      tokenVersion: 0,
    };
    users.admin = {
      id: 'admin-id',
      username: 'carlos',
      passwordHash,
      role: Role.BUSINESS_ADMIN,
      enabled: true,
      tokenVersion: 0,
    };
    users.disabled = {
      id: 'disabled-id',
      username: 'old',
      passwordHash,
      role: Role.SECRETARY,
      enabled: false,
      tokenVersion: 0,
    };
  });

  beforeEach(async () => {
    app = await createApp();
    users.secretary.role = Role.SECRETARY;
    users.secretary.tokenVersion = 0;
    users.secretary.enabled = true;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('login', () => {
    it('returns a token for valid credentials, whatever the case of the username', async () => {
      const response = await login('  MARIA ').expect(200);

      expect(response.body).toMatchObject({
        tokenType: 'Bearer',
        expiresIn: 8 * 60 * 60,
        user: { id: 'secretary-id', username: 'maria', role: Role.SECRETARY },
      });
      expect(response.body.accessToken.split('.')).toHaveLength(3);
      expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    });

    it.each([
      ['wrong password', 'maria', 'wrong-password-123'],
      ['unknown user', 'ghost', PASSWORD],
      ['disabled user', 'old', PASSWORD],
    ])('answers the same 401 for %s', async (_, username, password) => {
      const response = await login(username, password).expect(401);

      expect(response.body).toMatchObject({ message: 'Invalid username or password', code: 'UNAUTHORIZED' });
    });

    it('validates the body', async () => {
      await request(app.getHttpServer()).post('/auth/login').send({ username: 'maria' }).expect(400);
    });

    it('limits the attempts for the same username', async () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        await login('maria', 'wrong-password-123').expect(401);
      }

      await login('maria').expect(429);
      // Other usernames are not affected
      await login('carlos').expect(200);
    });

    it('limits the attempts from the same IP, whatever the username', async () => {
      for (let attempt = 0; attempt < 20; attempt++) {
        await login(`user${attempt}`).expect(401);
      }

      await login('carlos').expect(429);
    });
  });

  describe('authentication', () => {
    it.each([
      ['GET', '/clients'],
      ['GET', '/health-orders'],
      ['GET', '/users'],
      ['GET', '/auth/me'],
    ])('rejects %s %s without a token', async (method, path) => {
      await request(app.getHttpServer())[method.toLowerCase()](path).expect(401);
    });

    it('rejects a malformed token', async () => {
      await request(app.getHttpServer()).get('/clients').set('Authorization', 'Bearer not-a-jwt').expect(401);
    });

    it('identifies the user of the token', async () => {
      const token = await tokenOf('maria');

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({ id: 'secretary-id', username: 'maria', role: Role.SECRETARY });
    });

    it('stops accepting the token as soon as the user is disabled', async () => {
      const token = await tokenOf('maria');
      users.secretary.enabled = false;

      await request(app.getHttpServer()).get('/clients').set('Authorization', `Bearer ${token}`).expect(401);
    });

    it('stops accepting the token as soon as the token version changes', async () => {
      const token = await tokenOf('maria');
      users.secretary.tokenVersion += 1;

      await request(app.getHttpServer()).get('/clients').set('Authorization', `Bearer ${token}`).expect(401);
    });

    it('uses the current role of the user, not the one in the token', async () => {
      const token = await tokenOf('maria');
      users.secretary.role = Role.BUSINESS_ADMIN;

      await request(app.getHttpServer()).get('/users').set('Authorization', `Bearer ${token}`).expect(200);
    });
  });

  describe('roles', () => {
    it.each(['maria', 'carlos'])('lets %s call the client and health order endpoints', async username => {
      const token = await tokenOf(username);

      await request(app.getHttpServer()).get('/clients').set('Authorization', `Bearer ${token}`).expect(200);
      await request(app.getHttpServer()).get('/health-orders').set('Authorization', `Bearer ${token}`).expect(200);
    });

    it('lets only the business administrator manage users', async () => {
      const secretaryToken = await tokenOf('maria');
      const adminToken = await tokenOf('carlos');
      const newUser = { username: 'ana', password: PASSWORD, role: Role.SECRETARY };

      await request(app.getHttpServer()).get('/users').set('Authorization', `Bearer ${secretaryToken}`).expect(403);
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send(newUser)
        .expect(403);
      expect(fakeUsersService.create).not.toHaveBeenCalled();

      await request(app.getHttpServer()).get('/users').set('Authorization', `Bearer ${adminToken}`).expect(200);
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201);
    });
  });
});

import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    service = new PasswordService({ bcryptRounds: 4 } as any);
    await service.onModuleInit();
  });

  it('hashes with bcrypt and a random salt', async () => {
    const first = await service.hash('a-long-password');
    const second = await service.hash('a-long-password');

    expect(first).toMatch(/^\$2[aby]\$04\$/);
    expect(first).not.toEqual(second);
  });

  it('verifies the password against its hash', async () => {
    const hash = await service.hash('a-long-password');

    await expect(service.verify('a-long-password', hash)).resolves.toBe(true);
    await expect(service.verify('another-password', hash)).resolves.toBe(false);
  });

  it('never matches when there is no hash, but still does the comparison', async () => {
    await expect(service.verify('a-long-password', undefined)).resolves.toBe(false);
  });
});

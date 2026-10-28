import { loadAuthConfig } from './auth.config';

const validAuth = () => ({
  jwt: { secret: 'a'.repeat(32), expiresIn: '8h', issuer: 'issuer', audience: 'audience' },
  bcryptRounds: 12,
  loginRateLimit: { limitPerUsername: 5, limitPerIp: 20, windowInSeconds: 60 },
});

describe('loadAuthConfig', () => {
  it('reads the test configuration by default', () => {
    expect(loadAuthConfig()).toMatchObject({ jwtExpiresIn: '8h', bcryptRounds: 4 });
  });

  it('maps the configuration', () => {
    expect(loadAuthConfig(validAuth())).toEqual({
      jwtSecret: 'a'.repeat(32),
      jwtExpiresIn: '8h',
      jwtIssuer: 'issuer',
      jwtAudience: 'audience',
      bcryptRounds: 12,
      loginLimitPerUsername: 5,
      loginLimitPerIp: 20,
      loginRateWindowInMs: 60000,
    });
  });

  it('accepts numbers that come as strings from environment variables', () => {
    const auth = { ...validAuth(), bcryptRounds: '10' };
    expect(loadAuthConfig(auth).bcryptRounds).toBe(10);
  });

  it.each([undefined, '', 'short', 'a'.repeat(31)])('rejects the secret %p', secret => {
    const auth = validAuth();
    auth.jwt.secret = secret as any;
    expect(() => loadAuthConfig(auth)).toThrow('auth.jwt.secret must be at least 32 characters');
  });

  it('rejects a missing auth section', () => {
    expect(() => loadAuthConfig(null)).toThrow('auth.jwt.secret');
  });

  it.each(['8', '8 hours', 'h', '', undefined])('rejects the expiration %p', expiresIn => {
    const auth = validAuth();
    auth.jwt.expiresIn = expiresIn as any;
    expect(() => loadAuthConfig(auth)).toThrow('auth.jwt.expiresIn');
  });

  it.each([3, 16, 'x', 12.5])('rejects the bcrypt rounds %p', rounds => {
    expect(() => loadAuthConfig({ ...validAuth(), bcryptRounds: rounds })).toThrow('auth.bcryptRounds');
  });

  it.each([
    { limitPerUsername: 0, limitPerIp: 20, windowInSeconds: 60 },
    { limitPerUsername: 5, limitPerIp: 'x', windowInSeconds: 60 },
    { limitPerUsername: 5, limitPerIp: 20, windowInSeconds: 0 },
    undefined,
  ])('rejects the login rate limit %p', loginRateLimit => {
    expect(() => loadAuthConfig({ ...validAuth(), loginRateLimit })).toThrow('auth.loginRateLimit');
  });
});

export const AUTH_CONFIG = 'AUTH_CONFIG';

export const MIN_JWT_SECRET_LENGTH = 32;

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtIssuer: string;
  jwtAudience: string;
  bcryptRounds: number;
  loginLimitPerUsername: number;
  loginLimitPerIp: number;
  loginRateWindowInMs: number;
}

/**
 * Reads and validates the "auth" section of the configuration.
 * It throws when the section is not safe to use so the application fails at startup instead of issuing weak tokens.
 */
export const loadAuthConfig = (auth: Record<string, any> = require('config').auth): AuthConfig => {
  const secret = auth?.jwt?.secret;
  if (typeof secret !== 'string' || secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `auth.jwt.secret must be at least ${MIN_JWT_SECRET_LENGTH} characters long. ` +
        'Set it with the CEMEVYF_HEALTH_ORDERS_SERVICE_AUTH_JWT_SECRET environment variable',
    );
  }
  if (!/^\d+[smhd]$/.test(String(auth.jwt.expiresIn))) {
    throw new Error('auth.jwt.expiresIn must be a number followed by s, m, h or d (e.g. 30m, 8h, 1d)');
  }
  const bcryptRounds = Number(auth.bcryptRounds);
  if (!Number.isInteger(bcryptRounds) || bcryptRounds < 4 || bcryptRounds > 15) {
    throw new Error('auth.bcryptRounds must be an integer between 4 and 15');
  }
  const loginLimitPerUsername = Number(auth.loginRateLimit?.limitPerUsername);
  const loginLimitPerIp = Number(auth.loginRateLimit?.limitPerIp);
  const windowInSeconds = Number(auth.loginRateLimit?.windowInSeconds);
  if (
    ![loginLimitPerUsername, loginLimitPerIp].every(limit => Number.isInteger(limit) && limit >= 1) ||
    !(windowInSeconds > 0)
  ) {
    throw new Error('auth.loginRateLimit limits and windowInSeconds must be positive numbers');
  }
  return {
    jwtSecret: secret,
    jwtExpiresIn: String(auth.jwt.expiresIn),
    jwtIssuer: auth.jwt.issuer,
    jwtAudience: auth.jwt.audience,
    bcryptRounds,
    loginLimitPerUsername,
    loginLimitPerIp,
    loginRateWindowInMs: windowInSeconds * 1000,
  };
};

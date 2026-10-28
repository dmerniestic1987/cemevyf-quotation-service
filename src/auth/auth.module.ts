import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from '../users/users.module';
import { normalizeUsername } from '../users/validator/normalize-username';
import { AUTH_CONFIG, AuthConfig } from './auth.config';
import { AuthConfigModule } from './auth-config.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

const JWT_ALGORITHM = 'HS256';

@Module({
  imports: [
    AuthConfigModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [AuthConfigModule],
      inject: [AUTH_CONFIG],
      useFactory: (config: AuthConfig) => ({
        secret: config.jwtSecret,
        // Pinning the algorithm prevents algorithm confusion attacks (e.g. tokens signed with "none")
        signOptions: {
          algorithm: JWT_ALGORITHM,
          expiresIn: config.jwtExpiresIn as any,
          issuer: config.jwtIssuer,
          audience: config.jwtAudience,
        },
        verifyOptions: { algorithms: [JWT_ALGORITHM], issuer: config.jwtIssuer, audience: config.jwtAudience },
      }),
    }),
    // Only used by the login endpoint, through @UseGuards(ThrottlerGuard). The counters live in memory (one instance)
    ThrottlerModule.forRootAsync({
      imports: [AuthConfigModule],
      inject: [AUTH_CONFIG],
      useFactory: (config: AuthConfig) => ({
        throttlers: [
          {
            name: 'ip',
            ttl: config.loginRateWindowInMs,
            limit: config.loginLimitPerIp,
            getTracker: req => req.ip,
          },
          {
            name: 'username',
            ttl: config.loginRateWindowInMs,
            limit: config.loginLimitPerUsername,
            getTracker: req => String(normalizeUsername(req.body?.username) ?? 'unknown'),
          },
        ],
      }),
    }),
  ],
  providers: [
    AuthService,
    // Guards run in the order they are declared: authentication first, then the roles
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  controllers: [AuthController],
})
export class AuthModule {}

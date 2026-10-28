import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { unauthorizedError } from '../../commons/errors/exceptions';
import { UsersService } from '../../users/users.service';
import { Public } from '../decorators/public.decorator';
import { AuthenticatedUser, JwtPayload } from '../types/jwt-payload';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride(Public, [context.getHandler(), context.getClass()])) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw unauthorizedError('Missing bearer token');
    }

    let payload: JwtPayload;
    try {
      // Algorithm, issuer, audience and expiration are enforced by the options of the JwtModule
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch (error) {
      this.logger.debug(`Rejected token: ${error.message}`);
      throw unauthorizedError('Invalid or expired token');
    }

    // The user is read on every request so a disabled user, a role change or a password change take effect immediately
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.enabled || user.tokenVersion !== payload.tv) {
      throw unauthorizedError('Invalid or expired token');
    }
    request.user = { id: user.id, username: user.username, role: user.role };
    return true;
  }

  private extractBearerToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type?.toLowerCase() === 'bearer' && token ? token : undefined;
  }
}

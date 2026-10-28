import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { forbiddenError } from '../../commons/errors/exceptions';
import { Public } from '../decorators/public.decorator';
import { RolesMetadata } from '../decorators/roles.decorator';

/**
 * Denies by default: an endpoint that is neither @Public() nor declares its @Roles() cannot be called by anyone.
 * It must run after the JwtAuthGuard, which sets request.user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride(Public, targets)) {
      return true;
    }
    const roles = this.reflector.getAllAndOverride(RolesMetadata, targets);
    const user = context.switchToHttp().getRequest().user;
    if (!roles?.length) {
      this.logger.error(`${context.getClass().name}.${context.getHandler().name} does not declare its roles`);
      throw forbiddenError();
    }
    if (!user || !roles.includes(user.role)) {
      throw forbiddenError();
    }
    return true;
  }
}

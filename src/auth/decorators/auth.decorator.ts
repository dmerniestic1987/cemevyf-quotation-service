import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Role } from '../types/role.enum';
import { Roles } from './roles.decorator';

/**
 * Restricts a controller or an endpoint to the given roles and documents it in Swagger.
 * Use ALL_ROLES to open it to every authenticated user.
 */
export const Auth = (...roles: Role[]) =>
  applyDecorators(
    Roles(...roles),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Missing, invalid or expired token' }),
    ApiForbiddenResponse({ description: 'The role of the user cannot call this endpoint' }),
  );

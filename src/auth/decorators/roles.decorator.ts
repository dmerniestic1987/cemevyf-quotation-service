import { Reflector } from '@nestjs/core';
import { Role } from '../types/role.enum';

export const RolesMetadata = Reflector.createDecorator<Role[]>();

/** Roles allowed to call the endpoint. A method level @Roles overrides the one on the controller */
export const Roles = (...roles: Role[]) => RolesMetadata(roles);

import { Type } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { ClientController } from '../clients/client.controller';
import { HealthOrderController } from '../health-orders/health-order.controller';
import { UsersController } from '../users/users.controller';
import { Public } from './decorators/public.decorator';
import { RolesMetadata } from './decorators/roles.decorator';
import { Role } from './types/role.enum';

// Add every new controller here. The test fails if any of its endpoints forgot to declare who can call it
const CONTROLLERS = [AuthController, ClientController, HealthOrderController, UsersController];

const PUBLIC_ENDPOINTS = ['AuthController.login'];

const getEndpoints = (controller: Type<unknown>) =>
  Object.getOwnPropertyNames(controller.prototype)
    .filter(name => Reflect.hasMetadata(METHOD_METADATA, controller.prototype[name]))
    .map(name => ({ name: `${controller.name}.${name}`, handler: controller.prototype[name] }));

describe('endpoint security metadata', () => {
  const reflector = new Reflector();
  const endpoints = CONTROLLERS.flatMap(controller =>
    getEndpoints(controller).map(endpoint => ({ ...endpoint, controller })),
  );

  it('finds the endpoints', () => {
    expect(endpoints.length).toBeGreaterThanOrEqual(20);
    expect(CONTROLLERS.every(controller => Reflect.hasMetadata(PATH_METADATA, controller))).toBe(true);
  });

  it.each(endpoints.map(endpoint => [endpoint.name, endpoint] as const))(
    '%s declares its access rules',
    (_, endpoint) => {
      const targets = [endpoint.handler, endpoint.controller];
      const isPublic = reflector.getAllAndOverride(Public, targets) === true;
      const roles = reflector.getAllAndOverride(RolesMetadata, targets);

      expect(isPublic || roles?.length > 0).toBe(true);
    },
  );

  it('only exposes the expected public endpoints', () => {
    const publicEndpoints = endpoints
      .filter(endpoint => reflector.getAllAndOverride(Public, [endpoint.handler, endpoint.controller]) === true)
      .map(endpoint => endpoint.name);

    expect(publicEndpoints).toEqual(PUBLIC_ENDPOINTS);
  });

  it('keeps user management for the business administrator only', () => {
    for (const endpoint of endpoints.filter(endpoint => endpoint.controller === UsersController)) {
      expect(reflector.getAllAndOverride(RolesMetadata, [endpoint.handler, endpoint.controller])).toEqual([
        Role.BUSINESS_ADMIN,
      ]);
    }
  });
});

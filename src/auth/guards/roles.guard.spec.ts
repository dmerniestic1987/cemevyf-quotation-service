import { ExecutionContext, HttpStatus, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../types/role.enum';
import { RolesGuard } from './roles.guard';

type AnyFunction = (...args: any[]) => any;

@Roles(Role.SECRETARY, Role.BUSINESS_ADMIN)
class ClassLevelController {
  inherited() {}

  @Roles(Role.BUSINESS_ADMIN)
  adminOnly() {}

  @Public()
  open() {}
}

class UndeclaredController {
  forgotten() {}
}

const buildContext = (controller: Type<unknown>, handler: AnyFunction, user?: { role: Role }): ExecutionContext =>
  ({
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as any;

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());
  const proto = ClassLevelController.prototype;

  it.each([Role.SECRETARY, Role.BUSINESS_ADMIN])('applies the roles of the controller to %s', role => {
    expect(guard.canActivate(buildContext(ClassLevelController, proto.inherited, { role }))).toBe(true);
  });

  it('lets the roles of an endpoint override the ones of the controller', () => {
    expect(guard.canActivate(buildContext(ClassLevelController, proto.adminOnly, { role: Role.BUSINESS_ADMIN }))).toBe(
      true,
    );

    const attempt = () =>
      guard.canActivate(buildContext(ClassLevelController, proto.adminOnly, { role: Role.SECRETARY }));
    expect(attempt).toThrow(expect.objectContaining({ status: HttpStatus.FORBIDDEN }));
  });

  it('lets public endpoints through, even without a user', () => {
    expect(guard.canActivate(buildContext(ClassLevelController, proto.open))).toBe(true);
  });

  it('denies an endpoint that does not declare its roles, whoever calls it', () => {
    const attempt = () =>
      guard.canActivate(
        buildContext(UndeclaredController, UndeclaredController.prototype.forgotten, { role: Role.BUSINESS_ADMIN }),
      );

    expect(attempt).toThrow(expect.objectContaining({ status: HttpStatus.FORBIDDEN }));
  });

  it('denies a request without an authenticated user', () => {
    const attempt = () => guard.canActivate(buildContext(ClassLevelController, proto.inherited));

    expect(attempt).toThrow(expect.objectContaining({ status: HttpStatus.FORBIDDEN }));
  });
});

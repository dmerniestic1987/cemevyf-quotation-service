import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Auth } from './auth.decorator';
import { CurrentUser } from './current-user.decorator';
import { Public } from './public.decorator';
import { RolesMetadata } from './roles.decorator';
import { ALL_ROLES, Role } from '../types/role.enum';

describe('auth decorators', () => {
  it('ALL_ROLES contains every role', () => {
    expect(ALL_ROLES).toEqual([Role.SECRETARY, Role.BUSINESS_ADMIN]);
  });

  it('@Auth sets the roles and documents the endpoint in Swagger', () => {
    class Controller {
      @Auth(Role.BUSINESS_ADMIN)
      method() {}
    }
    const reflector = new Reflector();
    const handler = Controller.prototype.method;

    expect(reflector.get(RolesMetadata, handler)).toEqual([Role.BUSINESS_ADMIN]);
    expect(Reflect.getMetadata('swagger/apiSecurity', handler)).toEqual([{ bearer: [] }]);
    expect(Object.keys(Reflect.getMetadata('swagger/apiResponse', handler))).toEqual(['401', '403']);
  });

  it('@Auth works on a class', () => {
    @Auth(...ALL_ROLES)
    class Controller {}

    expect(new Reflector().get(RolesMetadata, Controller)).toEqual(ALL_ROLES);
  });

  it('@Public marks the endpoint', () => {
    class Controller {
      @Public()
      open() {}
      closed() {}
    }
    const reflector = new Reflector();

    expect(reflector.get(Public, Controller.prototype.open)).toBe(true);
    expect(reflector.get(Public, Controller.prototype.closed)).toBeUndefined();
  });

  it('@CurrentUser extracts the user of the request', () => {
    class Controller {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      method(@CurrentUser() _user: unknown) {}
    }
    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, Controller, 'method');
    const { factory } = Object.values<any>(metadata)[0];
    const user = { id: 'id' };

    expect(factory(undefined, { switchToHttp: () => ({ getRequest: () => ({ user }) }) })).toBe(user);
  });
});

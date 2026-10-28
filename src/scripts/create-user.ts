import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AppModule } from '../app.module';
import { Role } from '../auth/types/role.enum';
import { CreateUserRequestDto } from '../users/dto/create-user-request.dto';
import { UsersService } from '../users/users.service';

export const PASSWORD_ENV_VAR = 'NEW_USER_PASSWORD';

const USAGE =
  `Usage: npm run -s user:create -- <username> <${Object.values(Role).join('|')}> <password>\n` +
  `The password can also be given in the ${PASSWORD_ENV_VAR} environment variable instead of the third argument`;

/**
 * Builds and validates the user to create from the command line. It runs before the application starts, so a wrong
 * argument fails immediately without touching the database.
 * The password is read from the third argument or, if it is missing, from the NEW_USER_PASSWORD environment variable.
 * Neither the usage nor the validation errors include it.
 */
export const buildCreateUserDto = async (
  args: string[],
  env: Record<string, string | undefined>,
): Promise<CreateUserRequestDto> => {
  const [username, role, passwordArg] = args;
  const password = passwordArg ?? env[PASSWORD_ENV_VAR];
  if (!username || !role || !password) {
    throw new Error(USAGE);
  }
  // Same normalization and validation rules as the POST /users endpoint
  const dto = plainToInstance(CreateUserRequestDto, { username, role, password });
  const errors = await validate(dto, { validationError: { value: false } });
  if (errors.length) {
    throw new Error(errors.flatMap(error => Object.values(error.constraints ?? {})).join('\n'));
  }
  return dto;
};

/**
 * Creates a user without going through the API. It is meant for the first BUSINESS_ADMIN, the one who then creates
 * the other users through POST /users. The returned message never includes the password.
 */
export const createUser = async (
  usersService: Pick<UsersService, 'create'>,
  dto: CreateUserRequestDto,
): Promise<string> => {
  const user = await usersService.create(dto);
  return `User ${user.username} (${user.role}) created with ID ${user.id}`;
};

export const main = async (): Promise<void> => {
  let app: INestApplicationContext;
  try {
    const dto = await buildCreateUserDto(process.argv.slice(2), process.env);
    app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
    console.log(await createUser(app.get(UsersService), dto));
  } catch (error) {
    console.error(error.response?.message ?? error.message);
    process.exitCode = 1;
  } finally {
    await app?.close();
  }
};

if (require.main === module) {
  void main();
}

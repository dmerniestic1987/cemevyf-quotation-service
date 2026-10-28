import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { badRequestError, forbiddenError, notFoundError, resourceAlreadyExist } from '../commons/errors/exceptions';
import { BaseService } from '../commons/service/base-service';
import { CreateUserRequestDto } from './dto/create-user-request.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { UserEntityDtoMapper } from './dto/mapper/user-entity-dto-mapper';
import { UpdateUserRequestDto } from './dto/update-user-request.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PasswordService } from './password.service';
import { User } from './user.entity';

const MYSQL_DUPLICATE_ENTRY = 'ER_DUP_ENTRY';

@Injectable()
export class UsersService extends BaseService<User, UserResponseDto> {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly passwordService: PasswordService,
  ) {
    super();
  }

  async create(dto: CreateUserRequestDto): Promise<UserResponseDto> {
    this.logger.debug('Create user', { service: UsersService.name, username: dto.username, role: dto.role });
    if (await this.findByUsername(dto.username)) {
      throw resourceAlreadyExist(`Username ${dto.username} already exists`);
    }
    const user = new User();
    user.username = dto.username;
    user.role = dto.role;
    user.enabled = true;
    user.tokenVersion = 0;
    user.passwordHash = await this.passwordService.hash(dto.password);
    try {
      return UserEntityDtoMapper.userToResponseDto(await this.usersRepository.save(user));
    } catch (error) {
      // Two concurrent requests can pass the check above; the unique index has the last word
      if ((error?.driverError?.code ?? error?.code) === MYSQL_DUPLICATE_ENTRY) {
        throw resourceAlreadyExist(`Username ${dto.username} already exists`);
      }
      throw error;
    }
  }

  async findUsers(filterDto: FilterUserDto, pageOptionsDto: PageOptionsDto): Promise<PageResponseDto<UserResponseDto>> {
    this.logger.debug('Find users', { service: UsersService.name, filterDto, pageOptionsDto });
    const where = {};
    if (filterDto.username) {
      where['username'] = Like(`%${filterDto.username}%`);
    }
    if (filterDto.role) {
      where['role'] = filterDto.role;
    }
    if (filterDto.enabled !== undefined) {
      where['enabled'] = filterDto.enabled;
    }
    return super.findAndPaginate(
      pageOptionsDto,
      this.usersRepository,
      where,
      undefined,
      UserEntityDtoMapper.userToResponseDto,
    );
  }

  async findUser(id: string): Promise<UserResponseDto> {
    return UserEntityDtoMapper.userToResponseDto(await this.getUserOrFail(id));
  }

  /** The entity with its password hash. For authentication only, never return it to a client */
  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  /** The entity with its password hash. For authentication only, never return it to a client */
  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async update(id: string, dto: UpdateUserRequestDto, actorId: string): Promise<UserResponseDto> {
    this.logger.debug('Update user', { service: UsersService.name, id, dto });
    // An administrator cannot demote or disable themselves, so there is always at least one administrator left
    if (id === actorId) {
      throw forbiddenError('You cannot change your own role or status');
    }
    const user = await this.getUserOrFail(id);
    const roleChanged = dto.role !== undefined && dto.role !== user.role;
    const enabledChanged = dto.enabled !== undefined && dto.enabled !== user.enabled;
    if (roleChanged || enabledChanged) {
      user.role = dto.role ?? user.role;
      user.enabled = dto.enabled ?? user.enabled;
      user.tokenVersion += 1;
      await this.usersRepository.save(user);
    }
    return UserEntityDtoMapper.userToResponseDto(user);
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    this.logger.debug('Reset user password', { service: UsersService.name, id });
    await this.setPassword(await this.getUserOrFail(id), newPassword);
  }

  async changeOwnPassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.getUserOrFail(id);
    if (!(await this.passwordService.verify(currentPassword, user.passwordHash))) {
      throw badRequestError('The current password is not correct', 'INVALID_CURRENT_PASSWORD');
    }
    await this.setPassword(user, newPassword);
  }

  // Raising the token version closes every session opened with the previous password
  private async setPassword(user: User, newPassword: string): Promise<void> {
    user.passwordHash = await this.passwordService.hash(newPassword);
    user.tokenVersion += 1;
    await this.usersRepository.save(user);
  }

  private async getUserOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw notFoundError(`User ID: ${id} was not found`);
    }
    return user;
  }
}

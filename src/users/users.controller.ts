import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/jwt-payload';
import { Role } from '../auth/types/role.enum';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { CreateUserRequestDto } from './dto/create-user-request.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { ResetPasswordRequestDto } from './dto/reset-password-request.dto';
import { UpdateUserRequestDto } from './dto/update-user-request.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Auth(Role.BUSINESS_ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Creates a user', operationId: 'createUser' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiConflictResponse({ description: 'The username already exists' })
  async createUser(@Body() dto: CreateUserRequestDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Gets a list of users', operationId: 'findUsers' })
  @ApiOkResponse({ type: [UserResponseDto] })
  async findUsers(@Query() filterDto: FilterUserDto): Promise<PageResponseDto<UserResponseDto>> {
    return this.usersService.findUsers(filterDto, filterDto);
  }

  @Get('/:id')
  @ApiParam({ type: 'string', name: 'id' })
  @ApiOperation({ summary: 'Gets a user', operationId: 'findUser' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  async findUser(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findUser(id);
  }

  @Patch('/:id')
  @ApiParam({ type: 'string', name: 'id' })
  @ApiOperation({
    summary: 'Changes the role of a user or enables/disables it',
    operationId: 'updateUser',
    description:
      'Users are never deleted: disable them instead. A change closes the sessions already opened by the user. ' +
      'You cannot change your own role or status.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRequestDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto, currentUser.id);
  }

  @Put('/:id/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ type: 'string', name: 'id' })
  @ApiOperation({
    summary: 'Sets a new password for a user',
    operationId: 'resetUserPassword',
    description: 'Closes the sessions already opened by the user',
  })
  @ApiNoContentResponse({ description: 'The password was changed' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async resetUserPassword(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ResetPasswordRequestDto): Promise<void> {
    await this.usersService.resetPassword(id, dto.newPassword);
  }
}

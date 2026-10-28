import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, Put, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ChangePasswordRequestDto } from './dto/change-password-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto, LoginUserDto } from './dto/login-response.dto';
import { AuthenticatedUser } from './types/jwt-payload';
import { ALL_ROLES } from './types/role.enum';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logs in with username and password', operationId: 'login' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid username or password' })
  @ApiTooManyRequestsResponse({ description: 'Too many login attempts' })
  async login(@Body() dto: LoginRequestDto, @Ip() ip: string): Promise<LoginResponseDto> {
    return this.authService.login(dto, ip);
  }

  @Auth(...ALL_ROLES)
  @Get('/me')
  @ApiOperation({ summary: 'Gets the user of the token', operationId: 'whoAmI' })
  @ApiOkResponse({ type: LoginUserDto })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<AuthenticatedUser> {
    return user;
  }

  @Auth(...ALL_ROLES)
  @Put('/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Changes the password of the user of the token',
    operationId: 'changePassword',
    description: 'Closes every session of the user, including this one: the user must log in again',
  })
  @ApiNoContentResponse({ description: 'The password was changed' })
  @ApiBadRequestResponse({ description: 'The current password is not correct' })
  async changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordRequestDto): Promise<void> {
    await this.usersService.changeOwnPassword(user.id, dto.currentPassword, dto.newPassword);
  }
}

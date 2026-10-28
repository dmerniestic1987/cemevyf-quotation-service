import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { unauthorizedError } from '../commons/errors/exceptions';
import { PasswordService } from '../users/password.service';
import { UsersService } from '../users/users.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtPayload } from './types/jwt-payload';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginRequestDto, ip?: string): Promise<LoginResponseDto> {
    const user = await this.usersService.findByUsername(dto.username);
    // The password is always checked, even for an unknown user, so the response time does not reveal which users exist
    const passwordMatches = await this.passwordService.verify(dto.password, user?.passwordHash);
    if (!user || !user.enabled || !passwordMatches) {
      this.logger.warn(`Failed login for username "${dto.username}" from ${ip}`);
      throw unauthorizedError('Invalid username or password');
    }

    const payload: JwtPayload = { sub: user.id, role: user.role, tv: user.tokenVersion };
    const accessToken = await this.jwtService.signAsync(payload);
    const { iat, exp } = this.jwtService.decode<JwtPayload>(accessToken);
    this.logger.log(`Login of user ${user.id} (${user.role}) from ${ip}`);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: exp - iat,
      user: { id: user.id, username: user.username, role: user.role },
    };
  }
}

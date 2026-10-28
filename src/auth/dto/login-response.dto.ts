import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../types/role.enum';

export class LoginUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ enum: Role })
  role: Role;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Send it in the "Authorization: Bearer <token>" header' })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ description: 'Seconds until the token expires', example: 28800 })
  expiresIn: number;

  @ApiProperty({ type: LoginUserDto })
  user: LoginUserDto;
}

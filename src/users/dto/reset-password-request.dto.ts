import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { IsValidPassword } from '../validator/is-valid-password';

export class ResetPasswordRequestDto {
  @ApiProperty({ description: 'At least 12 characters and at most 72 bytes' })
  @IsString()
  @IsValidPassword()
  newPassword: string;
}

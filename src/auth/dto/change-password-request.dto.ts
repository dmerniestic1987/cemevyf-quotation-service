import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IsValidPassword } from '../../users/validator/is-valid-password';

export class ChangePasswordRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  currentPassword: string;

  @ApiProperty({ description: 'At least 12 characters and at most 72 bytes' })
  @IsString()
  @IsValidPassword()
  newPassword: string;
}

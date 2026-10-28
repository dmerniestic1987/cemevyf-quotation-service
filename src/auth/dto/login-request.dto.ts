import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { NormalizeUsername } from '../../users/validator/normalize-username';

export class LoginRequestDto {
  @ApiProperty({ example: 'maria.lopez' })
  @NormalizeUsername()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}

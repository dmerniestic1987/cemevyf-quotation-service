import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Matches } from 'class-validator';
import { Role } from '../../auth/types/role.enum';
import { IsValidPassword } from '../validator/is-valid-password';
import { NormalizeUsername } from '../validator/normalize-username';

export class CreateUserRequestDto {
  @ApiProperty({
    description: 'The username. It is case insensitive and is stored in lower case',
    example: 'maria.lopez',
  })
  @NormalizeUsername()
  @IsString()
  @Matches(/^[a-z0-9._-]{3,50}$/, {
    message: 'username must have between 3 and 50 characters: letters, numbers, dots, underscores or hyphens',
  })
  username: string;

  @ApiProperty({ description: 'At least 12 characters and at most 72 bytes' })
  @IsString()
  @IsValidPassword()
  password: string;

  @ApiProperty({ enum: Role, example: Role.SECRETARY })
  @IsEnum(Role)
  role: Role;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Role } from '../../auth/types/role.enum';

export class UpdateUserRequestDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: 'false disables the user: the sessions already opened stop working' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

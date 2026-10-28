import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '../../auth/types/role.enum';
import { PageOptionsDto } from '../../commons/dto/page-options.dto';
import { NormalizeUsername } from '../validator/normalize-username';

export class FilterUserDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Part of the username', example: 'maria' })
  @IsOptional()
  @NormalizeUsername()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  enabled?: boolean;
}

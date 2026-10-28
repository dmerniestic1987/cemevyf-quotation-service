import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../auth/types/role.enum';

export class UserResponseDto {
  @ApiProperty({ example: 'd5b13516-0557-4ca1-96f5-a6eeedec5472' })
  id: string;

  @ApiProperty({ example: 'maria.lopez' })
  username: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty()
  enabled: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

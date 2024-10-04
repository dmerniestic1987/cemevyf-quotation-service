import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID } from 'class-validator';
import { ClientIdTypeEnum } from '../../commons/types/client-id-type.enum';

export class FilterClientDto {
  @ApiProperty({
    description: 'The ID',
    required: false,
    example: 'd5b13516-0557-4ca1-96f5-a6eeedec5472',
  })
  @IsUUID()
  id?: string;

  @ApiProperty({
    description: 'The first name',
    required: false,
    example: 'Diego',
  })
  @IsString()
  clientFirstName?: string;

  @ApiProperty({
    description: 'The last name',
    required: false,
    example: 'Rossi',
  })
  @IsString()
  clientLastName?: string;

  @ApiProperty({
    description: 'The ID type of Patient',
    required: false,
    default: ClientIdTypeEnum.DNI,
    example: ClientIdTypeEnum.DNI,
  })
  @IsEnum(ClientIdTypeEnum)
  clientIdType?: ClientIdTypeEnum;

  @ApiProperty({
    description: 'The ID of Patient',
    required: false,
    example: '32847809',
  })
  @IsString()
  clientId?: string;
}

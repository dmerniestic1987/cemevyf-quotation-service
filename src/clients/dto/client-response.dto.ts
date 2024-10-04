import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID } from 'class-validator';
import { ClientIdTypeEnum } from '../../commons/types/client-id-type.enum';

export class ClientResponseDto {
  @ApiProperty({
    description: 'The ID',
    required: true,
    example: 'd5b13516-0557-4ca1-96f5-a6eeedec5472',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'The first name',
    required: true,
    example: 'Diego',
  })
  @IsString()
  clientFirstName: string;

  @ApiProperty({
    description: 'The last name',
    required: true,
    example: 'Di Rossi',
  })
  @IsString()
  clientLastName: string;

  @ApiProperty({
    description: 'The ID type of Patient',
    required: false,
    default: ClientIdTypeEnum.DNI,
    example: ClientIdTypeEnum.DNI,
  })
  @IsEnum(ClientIdTypeEnum)
  clientIdType: ClientIdTypeEnum;

  @ApiProperty({
    description: 'The ID of Patient',
    required: false,
    example: '32847809',
  })
  @IsString()
  clientId: string;

  @ApiProperty({
    description: 'The ID in external system',
    required: false,
    example: 'A847809',
  })
  @IsString()
  externalId?: string;

  @ApiProperty({
    description: 'The ID in Bookly system',
    required: false,
    example: '88847809',
  })
  @IsString()
  booklyId?: string;
}

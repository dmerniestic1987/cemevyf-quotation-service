import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { ClientIdTypeEnum } from '../../commons/types/client-id-type.enum';

export class CreateClientRequestDto {
  @ApiProperty({
    description: 'The first name of the person who will receive the quotation',
    required: true,
    example: 'Diego',
  })
  @IsString()
  clientFirstName: string;

  @ApiProperty({
    description: 'The last name of the person who will receive the quotation',
    required: true,
    example: 'Di Rossi',
  })
  @IsString()
  clientLastName: string;

  @ApiProperty({
    description: 'The type Id of patient',
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

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsPhoneNumber, IsString } from 'class-validator';
import { IdTypeEnum } from '../../commons/types/id-type.enum';

export class ClientRequestDto {
  @ApiProperty({
    description: 'The first name',
    required: true,
    example: 'Diego',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'The last name',
    required: true,
    example: 'Di Rossi',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'The ID type of Patient',
    required: false,
    default: IdTypeEnum.DNI,
    example: IdTypeEnum.DNI,
  })
  @IsEnum(IdTypeEnum)
  personIdType: IdTypeEnum;

  @ApiProperty({
    description: 'The ID of Patient',
    required: false,
    example: '32847809',
  })
  @IsString()
  personId: string;

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

  @ApiProperty({
    description: 'The email of the client',
    required: false,
    example: 'example@hola.com',
  })
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'The phone number of the client',
    required: false,
    example: '1155667788',
  })
  phoneNumber?: string;
}

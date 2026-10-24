import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IdTypeEnum } from '../../commons/types/id-type.enum';

export class ClientRequestDto {
  @ApiProperty({
    description: 'The first name',
    required: true,
    example: 'Diego',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: 'The last name',
    required: true,
    example: 'Di Rossi',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    description: 'The ID type of Patient',
    required: false,
    enum: IdTypeEnum,
    example: IdTypeEnum.DNI,
  })
  @IsOptional()
  @IsEnum(IdTypeEnum)
  personIdType?: IdTypeEnum;

  @ApiProperty({
    description: 'The ID of Patient',
    required: false,
    example: '32847809',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  personId?: string;

  @ApiProperty({
    description: 'The ID in external system',
    required: false,
    example: 'A847809',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  externalId?: string;

  @ApiProperty({
    description: 'The ID in Bookly system',
    required: false,
    example: '88847809',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  booklyId?: string;

  @ApiProperty({
    description: 'The email of the client',
    required: false,
    example: 'example@hola.com',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({
    description: 'The phone number of the client',
    required: false,
    example: '1155667788',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  phoneNumber?: string;
}

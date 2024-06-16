import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { CurrencyEnum } from '../../commons/types/currency.enum';
import { ItemQuotationRequestDto } from './item-quotation-request.dto';
import { ClientIdTypeEnum } from '../../commons/types/client-id-type.enum';

export class FilterQuotationDto {
  @ApiProperty({
    description: 'The first name of the person who will receive the quotation',
    required: false,
    example: 3902,
  })
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'The from date the quotation was created',
    required: false,
    example: '2023-05-30T00:00:00.000Z',
  })
  @IsDateString()
  dateFrom: string;

  @ApiProperty({
    description: 'The to date the quotation was created',
    required: false,
    example: '2023-12-31T00:00:00.000Z',
  })
  @IsDateString()
  dateTo: string;

  @ApiProperty({
    description: 'The first name of the person who will receive the quotation',
    required: false,
    example: 'Diego',
  })
  @IsString()
  clientFirstName: string;

  @ApiProperty({
    description: 'The last name of the person who will receive the quotation',
    required: false,
    example: 'Di Rossi',
  })
  @IsString()
  clientLastName: string;

  @ApiProperty({
    description: 'The type Id of patient',
    required: false,
    default: ClientIdTypeEnum.DNI,
    example: ClientIdTypeEnum.DNI,
    enum: ClientIdTypeEnum,
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
    description: 'The currency to estimate the quotation',
    required: false,
    example: CurrencyEnum.ARS,
    default: CurrencyEnum.ARS,
    enum: CurrencyEnum,
  })
  @IsEnum(CurrencyEnum)
  public currency: CurrencyEnum;
}
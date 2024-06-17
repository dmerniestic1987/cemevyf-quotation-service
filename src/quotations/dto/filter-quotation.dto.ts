import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
} from 'class-validator';
import { CurrencyEnum } from '../../commons/types/currency.enum';

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
    description: 'The currency to estimate the quotation',
    required: false,
    example: CurrencyEnum.ARS,
    default: CurrencyEnum.ARS,
    enum: CurrencyEnum,
  })
  @IsEnum(CurrencyEnum)
  public currency: CurrencyEnum;
}

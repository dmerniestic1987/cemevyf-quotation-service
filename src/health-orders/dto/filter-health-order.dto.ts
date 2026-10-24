import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { CurrencyEnum } from '../../commons/types/currency.enum';
import { PageOptionsDto } from '../../commons/dto/page-options.dto';

export class FilterHealthOrderDto extends PageOptionsDto {
  @ApiProperty({
    description: 'The ID of the health order',
    required: false,
    example: 3902,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id?: number;

  @ApiProperty({
    description: 'The from date the quotation was created',
    required: false,
    example: '2023-05-30T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({
    description: 'The to date the quotation was created',
    required: false,
    example: '2023-12-31T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({
    description: 'The currency to estimate the quotation',
    required: false,
    example: CurrencyEnum.ARS,
    enum: CurrencyEnum,
  })
  @IsOptional()
  @IsEnum(CurrencyEnum)
  public currency?: CurrencyEnum;
}

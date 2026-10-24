import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { CurrencyEnum } from '../../commons/types/currency.enum';
import { ItemHealthOrderRequestDto } from './item-health-order-request.dto';

export class UpdateHealthOrderRequestDto {
  @ApiProperty({
    description: 'The currency to estimate the quotation',
    required: false,
    enum: CurrencyEnum,
    example: CurrencyEnum.ARS,
  })
  @IsOptional()
  @IsEnum(CurrencyEnum)
  public currency?: CurrencyEnum;

  @ApiProperty({
    description: 'The list of items. When present it replaces all current items and the total amount is recomputed',
    required: false,
    minItems: 1,
    type: [ItemHealthOrderRequestDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemHealthOrderRequestDto)
  public orderItems?: ItemHealthOrderRequestDto[];
}

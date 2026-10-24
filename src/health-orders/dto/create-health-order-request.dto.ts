import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { CurrencyEnum } from '../../commons/types/currency.enum';
import { ItemHealthOrderRequestDto } from './item-health-order-request.dto';

export class CreateHealthOrderRequestDto {
  @ApiProperty({
    description: 'The ID of the client',
    required: true,
    example: '14e7b437-3c5c-44a6-8d99-a0fab3ef6c40',
  })
  @IsUUID()
  clientId: string;

  @ApiProperty({
    description: 'The currency to estimate the quotation',
    required: false,
    enum: CurrencyEnum,
    example: CurrencyEnum.ARS,
    default: CurrencyEnum.ARS,
  })
  @IsOptional()
  @IsEnum(CurrencyEnum)
  public currency?: CurrencyEnum;

  @ApiProperty({
    description: 'The list of items. The total amount is computed by the server from these items',
    required: true,
    minItems: 1,
    type: [ItemHealthOrderRequestDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemHealthOrderRequestDto)
  public quotationItems: ItemHealthOrderRequestDto[];
}

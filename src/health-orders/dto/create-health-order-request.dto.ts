import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsNumber, IsString } from 'class-validator';
import { CurrencyEnum } from '../../commons/types/currency.enum';
import { ItemHealthOrderRequestDto } from './item-health-order-request.dto';

export class CreateHealthOrderRequestDto {
  @ApiProperty({
    description: 'The ID of the client',
    required: true,
    example: '14e7b437-3c5c-44a6-8d99-a0fab3ef6c40',
  })
  @IsString()
  @IsEmail()
  clientId: string;

  @ApiProperty({
    description: 'total amount of quotation computed by client',
    required: false,
    example: '37500.50',
    minimum: 0,
    maximum: 9999999.99,
    default: '0',
  })
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  totalAmount: string;

  @ApiProperty({
    description: 'The currency to estimate the quotation',
    required: false,
    example: CurrencyEnum.ARS,
    default: CurrencyEnum.ARS,
  })
  @IsEnum(CurrencyEnum)
  public currency: CurrencyEnum;

  @ApiProperty({
    description: 'The list of items',
    required: true,
    minLength: 0,
    type: [ItemHealthOrderRequestDto],
  })
  @IsArray()
  public quotationItems: ItemHealthOrderRequestDto[];
}

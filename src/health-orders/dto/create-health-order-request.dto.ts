import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsNumber, IsObject, IsString } from 'class-validator';
import { CurrencyEnum } from '../../commons/types/currency.enum';
import { ItemHealthOrderRequestDto } from './item-health-order-request.dto';
import { ClientResponseDto } from '../../clients/dto/client-response.dto';

export class CreateHealthOrderRequestDto {
  @ApiProperty({
    description: 'Personal information of the client',
    required: true,
  })
  @IsObject()
  client: ClientResponseDto;

  @ApiProperty({
    description: 'target e-mail to send quotation',
    required: true,
    example: 'example@cemevyf.com',
  })
  @IsString()
  @IsEmail()
  eMail: string;

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

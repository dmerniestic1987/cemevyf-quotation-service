import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsNumber, IsObject, IsString } from 'class-validator';
import { CurrencyEnum } from '../../commons/types/currency.enum';
import { ItemQuotationRequestDto } from './item-quotation-request.dto';
import { CreateClientRequestDto } from '../../clients/dto/create-client-request.dto';

export class CreateQuotationRequestDto {
  @ApiProperty({
    description: 'Personal information of the client',
    required: true,
  })
  @IsObject()
  client: CreateClientRequestDto;

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
    type: [ItemQuotationRequestDto],
  })
  @IsArray()
  public quotationItems: ItemQuotationRequestDto[];
}

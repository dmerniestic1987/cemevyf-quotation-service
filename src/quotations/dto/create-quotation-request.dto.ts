import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNumber, IsString } from 'class-validator';
import { CurrencyEnum } from '../../commons/types/currency.enum';

export class CreateQuotationRequestDto {
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
  })
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @IsEmail()
  totalAmount: string;

  @ApiProperty({
    description: 'The currency to estimate the quotation',
    required: false,
    example: CurrencyEnum.ARS,
    default: CurrencyEnum.ARS,
  })
  @IsEnum(CurrencyEnum)
  @IsEmail()
  public currency: CurrencyEnum;

  @ApiProperty({
    description: 'The list of items',
    required: true,
    example: CurrencyEnum.ARS,
    default: CurrencyEnum.ARS,
  })
  @IsEnum(CurrencyEnum)
  @IsEmail()
  public quotationItems: any;
}

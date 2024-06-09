import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsNumber, IsString } from 'class-validator';
import { CurrencyEnum } from '../../commons/types/currency.enum';
import { ItemQuotationRequestDto } from './item-quotation-request.dto';
import { PersonIdTypeEnum } from '../../commons/types/person-id-type.enum';

export class CreateQuotationRequestDto {
  @ApiProperty({
    description: 'The first name of the person who will receive the quotation',
    required: true,
    example: 'Diego',
  })
  @IsString()
  patientFirstName: string;

  @ApiProperty({
    description: 'The last name of the person who will receive the quotation',
    required: true,
    example: 'Di Rossi',
  })
  @IsString()
  patientLastName: string;

  @ApiProperty({
    description: 'The type Id of patient',
    required: false,
    default: PersonIdTypeEnum.DNI,
    example: PersonIdTypeEnum.DNI,
  })
  @IsEnum(PersonIdTypeEnum)
  patientIdType: PersonIdTypeEnum;

  @ApiProperty({
    description: 'The ID of Patient',
    required: true,
    example: '32847809',
  })
  @IsString()
  patientId: string;

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

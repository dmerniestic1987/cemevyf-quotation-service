import { ApiProperty } from '@nestjs/swagger';
import {CurrencyEnum} from "../../commons/types/currency.enum";

export class QuotationResponseDto {
  @ApiProperty({
    description: `Quotation ID`,
    required: true,
    example: 12001,
  })
  id: number;

  @ApiProperty({
    description: 'Quotation item count',
    required: true,
    example: 4,
  })
  itemCount: number;

  @ApiProperty({
    description: 'The currency used to create the quotation',
    required: true,
    example: 4,
  })
  public currency: CurrencyEnum;

  @ApiProperty({
    description: 'The total amount of the the quotation',
    required: true,
    example: 45000.99,
  })
  public totalAmount: number;
}

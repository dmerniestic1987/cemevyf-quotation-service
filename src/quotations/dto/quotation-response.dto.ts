import { ApiProperty } from '@nestjs/swagger';
import { CurrencyEnum } from '../../commons/types/currency.enum';
import { ItemQuotationResponseDto } from './item-quotation-response.dto';

export class QuotationResponseDto {
  @ApiProperty({
    description: `Quotation ID`,
    example: 12001,
  })
  id: number;

  @ApiProperty({
    description: 'The currency used to create the quotation',
    example: 4,
  })
  public currency: CurrencyEnum;

  @ApiProperty({
    description: 'The total amount of the the quotation',
    example: 45000.99,
  })
  public totalAmount: number;

  @ApiProperty({
    description: 'Creation Date in ISO 8601 format',
    example: '2023-05-30T00:00:00.000Z',
  })
  public createdAt: string;

  @ApiProperty({
    description: 'The list of items',
  })
  public items?: ItemQuotationResponseDto[];
}

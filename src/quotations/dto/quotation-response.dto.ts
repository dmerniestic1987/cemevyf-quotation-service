import { ApiProperty } from '@nestjs/swagger';

export class QuotationResponseDto {
  @ApiProperty({
    description: `Quotation ID`,
    required: true,
    example: 12001,
  })
  id: number;

  @ApiProperty({
    description: `Quotation item count`,
    required: true,
    example: 4,
  })
  itemCount: number;
}

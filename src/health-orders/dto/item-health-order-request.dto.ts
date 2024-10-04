import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString } from 'class-validator';

export class ItemHealthOrderRequestDto {
  @ApiProperty({
    description: 'The code of item',
    required: false,
    example: 'T4L',
  })
  @IsString()
  code?: string;

  @ApiProperty({
    description: 'The name of item',
    required: false,
    example: 'T4 Libre',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'total amount of quotation computed by client',
    required: true,
    example: '37500.50',
  })
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  unitPrice: string;

  @ApiProperty({
    description: 'total number of items',
    required: false,
    example: 2,
    default: 1,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  itemCount: number;
}

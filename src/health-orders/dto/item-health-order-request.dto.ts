import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class ItemHealthOrderRequestDto {
  @ApiProperty({
    description: 'The code of item',
    required: false,
    example: 'T4L',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  code?: string;

  @ApiProperty({
    description: 'The name of item',
    required: true,
    example: 'T4 Libre',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'The unit price of the item, as a non-negative decimal string with up to 2 decimal places',
    required: true,
    example: '37500.50',
  })
  @IsString()
  @Matches(/^\d{1,10}(\.\d{1,2})?$/, {
    message: 'unitPrice must be a non-negative decimal string with up to 10 integer digits and 2 decimal places',
  })
  unitPrice: string;

  @ApiProperty({
    description: 'total number of items',
    required: true,
    example: 2,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  itemCount: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsInt, Min } from 'class-validator';
import { UpdateHealthOrderStatusRequestDto } from './update-health-order-status-request.dto';

export const MAX_BULK_STATUS_UPDATE_IDS = 100;

export class BulkUpdateHealthOrderStatusRequestDto extends UpdateHealthOrderStatusRequestDto {
  @ApiProperty({
    description: 'The IDs of the health orders. All of them move to the same status or none of them does',
    required: true,
    type: [Number],
    minItems: 1,
    maxItems: MAX_BULK_STATUS_UPDATE_IDS,
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_STATUS_UPDATE_IDS)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  public ids: number[];
}

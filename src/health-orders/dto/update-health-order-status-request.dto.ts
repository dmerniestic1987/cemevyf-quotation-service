import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { HealthOrderStatus } from '../types/health-order-status';

export class UpdateHealthOrderStatusRequestDto {
  @ApiProperty({
    description: 'The health order status',
    required: true,
    example: HealthOrderStatus.PENDING_RESULTS,
    enum: HealthOrderStatus,
  })
  @IsEnum(HealthOrderStatus)
  public status: HealthOrderStatus;
}

import { ApiProperty } from '@nestjs/swagger';
import { CurrencyEnum } from '../../commons/types/currency.enum';
import { ItemHealthOrderResponseDto } from './item-health-order-response.dto';
import { HealthOrderStatus } from '../types/health-order-status';
import { HealthOrderClientDto } from './health-order-client.dto';

export class HealthOrderResponseDto {
  @ApiProperty({
    description: `Quotation ID`,
    example: 12001,
  })
  id: number;

  @ApiProperty({
    description: 'The currency used to create the quotation',
    enum: CurrencyEnum,
    example: CurrencyEnum.ARS,
  })
  public currency: CurrencyEnum;

  @ApiProperty({
    description: 'The status of the quotation',
    enum: HealthOrderStatus,
    example: HealthOrderStatus.QUOTED,
  })
  public status: HealthOrderStatus;

  @ApiProperty({
    description: 'The exact sum of the items of the quotation',
    example: 31245.4,
  })
  public subtotalAmount: number;

  @ApiProperty({
    description: 'The total amount of the quotation: the subtotal rounded up to a multiple of 100',
    example: 31300,
  })
  public totalAmount: number;

  @ApiProperty({
    description: 'Creation Date in ISO 8601 format',
    example: '2023-05-30T00:00:00.000Z',
  })
  public createdAt: string;

  @ApiProperty({
    description: 'Execution date in ISO 8601 format',
    example: '2025-05-30T00:00:00.000Z',
  })
  public executedAt: string;

  @ApiProperty({
    description: 'The list of items',
    required: false,
    type: [ItemHealthOrderResponseDto],
  })
  public items?: ItemHealthOrderResponseDto[];

  @ApiProperty({
    description: 'The client who requested the health order. It is missing while no client is assigned',
    required: false,
    type: HealthOrderClientDto,
  })
  public client?: HealthOrderClientDto;

  @ApiProperty({
    description: 'True if e-mail was sent to the client',
    example: true,
  })
  public sentMail?: boolean;
}

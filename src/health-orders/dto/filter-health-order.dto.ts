import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { CurrencyEnum } from '../../commons/types/currency.enum';
import { HealthOrderStatus } from '../types/health-order-status';
import { PageOptionsDto } from '../../commons/dto/page-options.dto';

export class FilterHealthOrderDto extends PageOptionsDto {
  @ApiProperty({
    description: 'The ID of the health order',
    required: false,
    example: 3902,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id?: number;

  @ApiProperty({
    description: 'The ID of the client the health order belongs to',
    required: false,
    example: 'd5b13516-0557-4ca1-96f5-a6eeedec5472',
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({
    description: 'The from date the quotation was created',
    required: false,
    example: '2023-05-30T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({
    description: 'The to date the quotation was created',
    required: false,
    example: '2023-12-31T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({
    description: 'The currency to estimate the quotation',
    required: false,
    example: CurrencyEnum.ARS,
    enum: CurrencyEnum,
  })
  @IsOptional()
  @IsEnum(CurrencyEnum)
  public currency?: CurrencyEnum;

  @ApiProperty({
    description: 'The status of the health order',
    required: false,
    example: HealthOrderStatus.EXECUTED,
    enum: HealthOrderStatus,
  })
  @IsOptional()
  @IsEnum(HealthOrderStatus)
  public status?: HealthOrderStatus;
}

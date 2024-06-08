import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { WalletType } from '../../commons/types/wallet-type.enum';
import {Quotation} from "../quotation.entity";

export class ProviderResponseDto {
  @ApiProperty({
    description: `The provider's ID`,
    required: true,
    example: 'AAA076F8-17BD-5195-768F-0E75B4258669',
  })
  id: string;

  @ApiProperty({
    description: 'The provider name',
    required: false,
    example: WalletType.LOCAL,
  })
  @IsString()
  providerName: string;

  public static fromProvider(provider: Quotation): ProviderResponseDto {
    const dto = new ProviderResponseDto();
    return dto;
  }
}

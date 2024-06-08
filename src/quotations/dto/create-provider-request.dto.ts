import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { WalletType } from '../../commons/types/wallet-type.enum';

export class CreateProviderRequestDto {
  @ApiProperty({
    description: 'The provider Name',
    required: true,
    example: WalletType.HSM,
  })
  @IsString()
  providerName: string;
}

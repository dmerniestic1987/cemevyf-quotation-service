import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CurrencyEnum } from '../../commons/types/currency.enum';
import { MessageChannelEnum } from '../../commons/types/message-channel.enum';

export class SendQuotationByMessageRequestDto {
  @ApiProperty({
    description: 'The channel to send quotation',
    required: true,
    example: MessageChannelEnum.E_MAIL,
    default: MessageChannelEnum.E_MAIL,
  })
  @IsEnum(CurrencyEnum)
  public channel: MessageChannelEnum;
}

import { ApiProperty } from '@nestjs/swagger';
import { CurrencyEnum } from '../../commons/types/currency.enum';
import { ItemQuotationResponseDto } from './item-quotation-response.dto';
import { MessageChannelEnum } from '../../commons/types/message-channel.enum';
import { IsEnum } from 'class-validator';

export class QuotationSentMessageResponseDto {
  @ApiProperty({
    description: `Quotation ID`,
    example: 12001,
  })
  id: number;

  @ApiProperty({
    description: 'The channel used to send quotation',
    required: true,
    example: MessageChannelEnum.E_MAIL,
    default: MessageChannelEnum.E_MAIL,
  })
  public channel: MessageChannelEnum;
}

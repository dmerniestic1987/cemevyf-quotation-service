import { ApiProperty } from '@nestjs/swagger';
import { MessageChannelEnum } from '../../commons/types/message-channel.enum';

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

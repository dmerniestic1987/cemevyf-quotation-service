import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';
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

  @ApiProperty({
    description: 'The destination e-mail to send the order',
    required: false,
    example: 'example@example.com',
  })
  @IsEmail()
  public eMail?: string;
}

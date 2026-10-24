import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { MessageChannelEnum } from '../../commons/types/message-channel.enum';

export class SendHealthOrderEMailRequestDto {
  @ApiProperty({
    description: 'The channel to send quotation',
    required: true,
    enum: MessageChannelEnum,
    example: MessageChannelEnum.E_MAIL,
    default: MessageChannelEnum.E_MAIL,
  })
  @IsEnum(MessageChannelEnum)
  public channel: MessageChannelEnum;

  @ApiProperty({
    description: 'The destination e-mail to send the order',
    required: false,
    example: 'example@example.com',
  })
  @IsOptional()
  @IsEmail()
  public eMail?: string;
}

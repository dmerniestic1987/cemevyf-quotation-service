import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UpdateHealthOrderClientRequestDto {
  @ApiProperty({
    description: 'The ID of the client the health order belongs to',
    required: true,
    example: '14e7b437-3c5c-44a6-8d99-a0fab3ef6c40',
  })
  @IsUUID()
  public clientId: string;
}

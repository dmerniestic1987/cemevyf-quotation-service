import { ApiProperty } from '@nestjs/swagger';

export class CreateClientResponseDto {
  @ApiProperty({
    description: `Client ID`,
    example: 'E5602C37-F3BB-4463-AB77-394D30CEC077',
  })
  id: string;
}

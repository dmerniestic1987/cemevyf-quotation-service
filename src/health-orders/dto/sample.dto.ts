import { ApiProperty } from '@nestjs/swagger';

export class SampleDto {
  @ApiProperty({
    description: 'Name',
    format: 'binary',
  })
  name: string;
}

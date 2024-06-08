import { ApiProperty } from '@nestjs/swagger';

export class WhereObjectDto {
  @ApiProperty({ description: 'Where sentence' })
  readonly whereSentence: string;

  @ApiProperty({
    description: 'Parameters for the where sentence',
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  readonly parameters: { [key: string]: any };
}

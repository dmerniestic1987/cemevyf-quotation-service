import { ApiProperty } from '@nestjs/swagger';

export class AttachedFileResponseDto {
  @ApiProperty({
    description: 'The ID of the attached file',
    example: 'd5b13516-0557-4ca1-96f5-a6eeedec5472',
  })
  id: string;

  @ApiProperty({
    description: 'The original name of the uploaded file',
    example: 'prescription.pdf',
  })
  originalName: string;
}

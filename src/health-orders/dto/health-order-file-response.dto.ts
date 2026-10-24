import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HealthOrderFileType } from '../types/health-order-file-type';

export class HealthOrderFileResponseDto {
  @ApiProperty({ description: 'The ID of the file', example: 'd5b13516-0557-4ca1-96f5-a6eeedec5472' })
  id: string;

  @ApiProperty({
    description: 'The type of file',
    enum: HealthOrderFileType,
    example: HealthOrderFileType.HEALTH_ORDER_RESULT,
  })
  fileType: HealthOrderFileType;

  @ApiProperty({ description: 'The original name of the uploaded file', example: 'prescription.pdf' })
  originalName: string;

  @ApiProperty({ description: 'The MIME type detected from the file content', example: 'application/pdf' })
  mimeType: string;

  @ApiProperty({ description: 'The size of the file in bytes', example: 102400 })
  sizeBytes: number;

  @ApiPropertyOptional({ description: 'Additional notes of the file', example: 'We are still pending total Glucose' })
  additionalNotes?: string;

  @ApiProperty({ description: 'The upload date', example: '2026-10-24T20:43:44.323Z' })
  createdAt: string;
}

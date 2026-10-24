import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdditionalDataDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  additionalNotes?: string;
}

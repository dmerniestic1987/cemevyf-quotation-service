import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class HealthOrderClientDto {
  constructor(id: string, firstName: string, lastName: string) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName
  }
  
  @ApiProperty({
    description: 'The ID',
    required: true,
    example: 'd5b13516-0557-4ca1-96f5-a6eeedec5472',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'The first name',
    required: true,
    example: 'Diego',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'The last name',
    required: true,
    example: 'Di Rossi',
  })
  @IsString()
  lastName: string;
}

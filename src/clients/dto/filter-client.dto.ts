import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { IdTypeEnum } from '../../commons/types/id-type.enum';
import { PageOptionsDto } from '../../commons/dto/page-options.dto';

export class FilterClientDto extends PageOptionsDto {
  @ApiProperty({
    description: 'The ID',
    required: false,
    example: 'd5b13516-0557-4ca1-96f5-a6eeedec5472',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({
    description: 'The first name',
    required: false,
    example: 'Diego',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'The last name',
    required: false,
    example: 'Rossi',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'The ID type of Patient',
    required: false,
    enum: IdTypeEnum,
    example: IdTypeEnum.DNI,
  })
  @IsOptional()
  @IsEnum(IdTypeEnum)
  personIdType?: IdTypeEnum;

  @ApiProperty({
    description: 'The ID of Patient',
    required: false,
    example: '32847809',
  })
  @IsOptional()
  @IsString()
  personId?: string;
}

import { IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDataDto } from './page-meta-data.dto';

export class PageResponseDto<T> {
  @IsArray()
  @ApiProperty({ isArray: true, description: 'The list of records returned by API' })
  readonly data: T[];

  @ApiProperty({ type: () => PageMetaDataDto, description: 'Pagination metadata' })
  readonly meta: PageMetaDataDto;

  constructor(data: T[], meta: PageMetaDataDto) {
    this.data = data;
    this.meta = meta;
  }
}

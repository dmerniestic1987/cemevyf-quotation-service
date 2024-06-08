import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDataParameterDto } from './page-meta-data-parameter.dto';

export class PageMetaDataDto {
  @ApiProperty({ description: 'Current page' })
  readonly page: number;

  @ApiProperty({ description: 'The number of records per page' })
  readonly take: number;

  @ApiProperty({ description: 'Total number of records' })
  readonly itemCount: number;

  @ApiProperty({ description: 'The number of records of current page' })
  readonly pageCount: number;

  @ApiProperty({ description: 'True if there is a previous page' })
  readonly hasPreviousPage: boolean;

  @ApiProperty({ description: 'True if there is a next page' })
  readonly hasNextPage: boolean;

  constructor({ pageOptionsDto, itemCount }: PageMetaDataParameterDto) {
    this.page = pageOptionsDto.page;
    this.take = pageOptionsDto.take;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(this.itemCount / this.take);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.pageCount;
  }
}

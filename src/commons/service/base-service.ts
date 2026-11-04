import { Injectable } from '@nestjs/common';
import { PageOptionsDto } from '../dto/page-options.dto';
import { FindOptionsOrder, FindOptionsRelations, Repository } from 'typeorm';
import { PageResponseDto } from '../dto/page-response.dto';
import { PageMetaDataDto } from '../dto/page-meta-data.dto';

@Injectable()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class BaseService<T, U> {
  async findAndPaginate<T, V>(
    pageOptionsDto: PageOptionsDto,
    repository: Repository<T>,
    where = undefined,
    relations: FindOptionsRelations<T> = undefined,
    dtoToClassMapper: (T) => V,
    order: FindOptionsOrder<T> = undefined,
  ): Promise<PageResponseDto<V>> {
    const skip = (pageOptionsDto.page - 1) * pageOptionsDto.take;
    const [entities, itemCount] = await repository.findAndCount({
      where,
      skip: skip,
      take: pageOptionsDto.take,
      relations,
      order,
    });
    const items: V[] = (entities || []).map(entity => {
      return dtoToClassMapper(entity);
    });
    const pageMetaDto = new PageMetaDataDto({ itemCount, pageOptionsDto });
    return new PageResponseDto(items, pageMetaDto);
  }
}

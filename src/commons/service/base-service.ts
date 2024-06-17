import { Injectable } from '@nestjs/common';
import { PageOptionsDto } from '../dto/page-options.dto';
import { Repository } from 'typeorm';
import { PageResponseDto } from '../dto/page-response.dto';
import { PageMetaDataDto } from '../dto/page-meta-data.dto';

@Injectable()
export class BaseService<T, U> {

  async findAndPaginate<T, V>(
      pageOptionsDto: PageOptionsDto,
      repository: Repository<T>,
      where = undefined,
      relations: string[] = undefined,
      dtoToClassMapper: (T) => V,
  ): Promise<PageResponseDto<V>> {
    const skip = (pageOptionsDto.page - 1) * pageOptionsDto.take;
    const [entities, itemCount] = await repository.findAndCount({
      where,
      skip: skip,
      take: pageOptionsDto.take,
      relations
    })
    const items: V[] = (entities || []).map(entity => {
      return dtoToClassMapper(entity);
    });
    const pageMetaDto = new PageMetaDataDto({ itemCount, pageOptionsDto });
    return new PageResponseDto(items, pageMetaDto);
  }
}

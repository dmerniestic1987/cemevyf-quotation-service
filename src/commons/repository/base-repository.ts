import { Injectable } from '@nestjs/common';
import { PageOptionsDto } from '../dto/page-options.dto';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PageResponseDto } from '../dto/page-response.dto';
import { PageMetaDataDto } from '../dto/page-meta-data.dto';

@Injectable()
export class BaseRepository<T, U> {
  async create(createDto: U, repository: Repository<T>, entityClass: new () => T): Promise<T> {
    const entity = new entityClass();
    Object.assign(entity, createDto);
    return repository.save(entity);
  }

  async findAll<T, V>(
    pageOptionsDto: PageOptionsDto,
    repository: Repository<T>,
    where = '',
    parameters: object,
    queryBuilderType: string = undefined,
    dtoClass: new () => V,
  ): Promise<PageResponseDto<V>> {
    const skip = (pageOptionsDto.page - 1) * pageOptionsDto.take;
    const queryBuilder = repository.createQueryBuilder(queryBuilderType);
    queryBuilder.where(where, parameters).skip(skip).take(pageOptionsDto.take);
    const [entities, itemCount] = await queryBuilder.getManyAndCount();
    const items: V[] = (entities || []).map(entity => {
      const dto = new dtoClass();
      Object.assign(dto, entity);
      return dto;
    });
    const pageMetaDto = new PageMetaDataDto({ itemCount, pageOptionsDto });
    return new PageResponseDto(items, pageMetaDto);
  }
}

import { Logger } from '@nestjs/common';
import { Quotation } from './quotation.entity';
import { BaseRepository } from '../commons/repository/base-repository';
import { Repository } from 'typeorm';
import { CreateProviderRequestDto } from './dto/create-provider-request.dto';
import { ProviderResponseDto } from './dto/provider-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PageOptionsDto } from '../commons/dto/page-options.dto';

export class QuotationsRepository extends BaseRepository<Quotation, CreateProviderRequestDto> {
  private readonly usersLogger = new Logger(QuotationsRepository.name);
  constructor(
    @InjectRepository(Quotation)
    private readonly providersRepository: Repository<Quotation>,
  ) {
    super();
  }

  async createProvider(createProviderRequestDto: CreateProviderRequestDto): Promise<ProviderResponseDto> {
    this.usersLogger.debug('create user', { service: QuotationsRepository.name, createProviderRequestDto });
    const provider = await super.create(createProviderRequestDto, this.providersRepository, Quotation);
    return ProviderResponseDto.fromProvider(provider);
  }

  async findAllProviders(pageOptionsDto: PageOptionsDto) {
    this.usersLogger.debug('find all users', { service: QuotationsRepository.name });
    return super.findAll(pageOptionsDto, this.providersRepository, undefined, {}, undefined, ProviderResponseDto);
  }

  async findOneProvider(id: number): Promise<Quotation> {
    this.usersLogger.debug('find a user', { service: QuotationsRepository.name, id });
    return super.findOneOrFail(this.providersRepository, { id });
  }
}

import { Logger } from '@nestjs/common';
import { Quotation } from './quotation.entity';
import { BaseRepository } from '../commons/repository/base-repository';
import { Repository } from 'typeorm';
import { CreateQuotationRequestDto } from './dto/create-quotation-request.dto';
import { QuotationResponseDto } from './dto/quotation-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PageOptionsDto } from '../commons/dto/page-options.dto';

export class QuotationsRepository extends BaseRepository<Quotation, CreateQuotationRequestDto> {
  private readonly logger = new Logger(QuotationsRepository.name);
  constructor(
    @InjectRepository(Quotation)
    private readonly quotationRepository: Repository<Quotation>,
  ) {
    super();
  }

  async createQuotation(createProviderRequestDto: CreateQuotationRequestDto): Promise<QuotationResponseDto> {
    this.logger.debug('create user', { service: QuotationsRepository.name, createProviderRequestDto });
    const quotation = await super.create(createProviderRequestDto, this.quotationRepository, Quotation);
    return {
      id: quotation.id,
      itemCount: quotation.quotationItems.length,
    };
  }

  async findAllQuotations(pageOptionsDto: PageOptionsDto) {
    this.logger.debug('find all users', { service: QuotationsRepository.name });
    return super.findAll(pageOptionsDto, this.quotationRepository, undefined, {}, undefined, QuotationResponseDto);
  }
}

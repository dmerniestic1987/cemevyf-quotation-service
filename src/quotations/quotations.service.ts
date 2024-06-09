import { Body, Injectable, Logger, Query } from '@nestjs/common';
import { QuotationsRepository } from './quotations.repository';
import { CreateQuotationRequestDto } from './dto/create-quotation-request.dto';
import { QuotationResponseDto } from './dto/quotation-response.dto';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';

@Injectable()
export class QuotationsService {
  private logger = new Logger(QuotationsService.name);
  constructor(private readonly quotationRepository: QuotationsRepository) {}

  async createQuotation(createProviderDto: CreateQuotationRequestDto): Promise<QuotationResponseDto> {
    return this.quotationRepository.createQuotation(createProviderDto);
  }

  async findAll(pageOptionsDto: PageOptionsDto): Promise<PageResponseDto<QuotationResponseDto>> {
    return null;
  }
}

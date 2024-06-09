import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateQuotationRequestDto } from './dto/create-quotation-request.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QuotationResponseDto } from './dto/quotation-response.dto';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { QuotationsRepository } from './quotations.repository';

@ApiTags('quotations')
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationRepository: QuotationsRepository) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quotation', operationId: 'createQuotation' })
  @ApiOkResponse({ type: QuotationResponseDto })
  async create(@Body() createProviderDto: CreateQuotationRequestDto): Promise<QuotationResponseDto> {
    return this.quotationRepository.createQuotation(createProviderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Gets a list of all enabled quotations', operationId: 'findAllQuotations' })
  @ApiOkResponse({ type: [QuotationResponseDto] })
  async findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageResponseDto<QuotationResponseDto>> {
    return null;
  }
}

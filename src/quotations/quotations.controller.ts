import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateQuotationRequestDto } from './dto/create-quotation-request.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QuotationResponseDto } from './dto/quotation-response.dto';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { QuotationsService } from './quotations.service';
import { FilterQuotationDto } from './dto/filter-quotation.dto';

@ApiTags('quotations')
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationService: QuotationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quotation', operationId: 'createQuotation' })
  @ApiOkResponse({ type: QuotationResponseDto })
  async create(@Body() createProviderDto: CreateQuotationRequestDto): Promise<QuotationResponseDto> {
    return this.quotationService.createQuotation(createProviderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Gets a list of all enabled quotations', operationId: 'findAllQuotations' })
  @ApiOkResponse({ type: [QuotationResponseDto] })
  async findAll(
    @Query() filterDto: FilterQuotationDto,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<PageResponseDto<QuotationResponseDto>> {
    return this.quotationService.findAllQuotations(pageOptionsDto);
  }
}

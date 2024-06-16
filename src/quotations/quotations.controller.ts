import {Body, Controller, Get, Param, Post, Query} from '@nestjs/common';
import { CreateQuotationRequestDto } from './dto/create-quotation-request.dto';
import {ApiOkResponse, ApiOperation, ApiParam, ApiTags} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Gets a list of all enabled quotations', operationId: 'findQuotations' })
  @ApiOkResponse({ type: [QuotationResponseDto] })
  async findQuotations(
    @Query() filterDto: FilterQuotationDto,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<PageResponseDto<QuotationResponseDto>> {
    return this.quotationService.findAllQuotations(filterDto, pageOptionsDto);
  }

  @Get('/:id')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({ summary: 'Gets details of an specific quotation', operationId: 'findQuotation' })
  @ApiOkResponse({ type: QuotationResponseDto })
  async findQuotation(@Param('id') id): Promise<QuotationResponseDto> {
    return this.quotationService.findQuotation(id);
  }
}

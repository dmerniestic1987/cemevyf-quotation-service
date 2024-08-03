import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreateQuotationRequestDto } from './dto/create-quotation-request.dto';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { QuotationResponseDto } from './dto/quotation-response.dto';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { QuotationsService } from './quotations.service';
import { FilterQuotationDto } from './dto/filter-quotation.dto';
import { UpdateQuotationRequestDto } from './dto/update-quotation-request.dto';
import { SendQuotationByMessageRequestDto } from './dto/send-quotation-by-message-request.dto';
import { QuotationSentMessageResponseDto } from './dto/quotation-sent-message-response.dto';

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
    return this.quotationService.findQuotations(filterDto, pageOptionsDto);
  }

  @Get('/:id')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({ summary: 'Gets details of an specific quotation', operationId: 'findQuotation' })
  @ApiOkResponse({ type: QuotationResponseDto })
  async findQuotation(@Param('id') id): Promise<QuotationResponseDto> {
    return this.quotationService.findQuotation(id);
  }

  @Put('/:id')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({ summary: 'Updates an specific quotation', operationId: 'updateQuotation' })
  @ApiOkResponse({ type: QuotationResponseDto })
  async updateQuotation(
    @Param('id') id,
    @Body() updateQuotationDto: UpdateQuotationRequestDto,
  ): Promise<QuotationResponseDto> {
    return this.quotationService.updateQuotation(id, updateQuotationDto);
  }

  @Post('/:id/message')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({
    summary: 'Send a message with quotation to the customer or the supplier',
    operationId: 'sendQuotationByMessage',
  })
  @ApiOkResponse({ type: QuotationSentMessageResponseDto })
  async sendQuotationByMessage(
    @Param('id') id,
    @Body() updateQuotationDto: SendQuotationByMessageRequestDto,
  ): Promise<QuotationSentMessageResponseDto> {
    return this.quotationService.sendMessageWithQuotation(id, updateQuotationDto);
  }

  @Delete('/:id')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({ summary: 'Deletes an specific quotation', operationId: 'deleteQuotation' })
  @ApiOkResponse({ type: 'number', description: 'true if quotation was deleted' })
  async deleteQuotation(@Param('id') id): Promise<boolean> {
    const deleted = await this.quotationService.deleteQuotation(id);
    return deleted;
  }
}

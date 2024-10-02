import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreateHealthOrderRequestDto } from './dto/create-health-order-request.dto';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { HealthOrderResponseDto } from './dto/health-order-response.dto';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { HealthOrderService } from './health-order.service';
import { FilterHealthOrderDto } from './dto/filter-health-order.dto';
import { UpdateHealthOrderRequestDto } from './dto/update-health-order-request.dto';
import { SendHealthOrderEMailRequestDto } from './dto/send-health-order-e-mail-request.dto';
import { HealthOrderEmailSentResponseDto } from './dto/health-order-email-sent-response.dto';

@ApiTags('Health Orders')
@Controller('health-orders')
export class HealthOrderController {
  constructor(private readonly healthOrderService: HealthOrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quotation', operationId: 'createQuotation' })
  @ApiOkResponse({ type: HealthOrderResponseDto })
  async create(@Body() createProviderDto: CreateHealthOrderRequestDto): Promise<HealthOrderResponseDto> {
    return this.healthOrderService.create(createProviderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Gets a list of all enabled quotations', operationId: 'findQuotations' })
  @ApiOkResponse({ type: [HealthOrderResponseDto] })
  async findQuotations(
    @Query() filterDto: FilterHealthOrderDto,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<PageResponseDto<HealthOrderResponseDto>> {
    return this.healthOrderService.findOrders(filterDto, pageOptionsDto);
  }

  @Get('/:id')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({ summary: 'Gets details of an specific quotation', operationId: 'findQuotation' })
  @ApiOkResponse({ type: HealthOrderResponseDto })
  async findQuotation(@Param('id') id): Promise<HealthOrderResponseDto> {
    return this.healthOrderService.findOrder(id);
  }

  @Put('/:id')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({ summary: 'Updates an specific quotation', operationId: 'updateQuotation' })
  @ApiOkResponse({ type: HealthOrderResponseDto })
  async updateQuotation(
    @Param('id') id,
    @Body() updateQuotationDto: UpdateHealthOrderRequestDto,
  ): Promise<HealthOrderResponseDto> {
    return this.healthOrderService.update(id, updateQuotationDto);
  }

  @Post('/:id/message')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({
    summary: 'Send a message with quotation to the customer or the supplier',
    operationId: 'sendQuotationByMessage',
  })
  @ApiOkResponse({ type: HealthOrderEmailSentResponseDto })
  async sendQuotationByMessage(
    @Param('id') id,
    @Body() updateQuotationDto: SendHealthOrderEMailRequestDto,
  ): Promise<HealthOrderEmailSentResponseDto> {
    return this.healthOrderService.sendHealthOrderEMail(id, updateQuotationDto);
  }
}

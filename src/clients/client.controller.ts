import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { ClientService } from './client.service';
import { HealthOrderResponseDto } from '../health-orders/dto/health-order-response.dto';
import { CreateHealthOrderRequestDto } from '../health-orders/dto/create-health-order-request.dto';
import { FilterHealthOrderDto } from '../health-orders/dto/filter-health-order.dto';
import { UpdateHealthOrderRequestDto } from '../health-orders/dto/update-health-order-request.dto';
import { CreateClientResponseDto } from './dto/create-client-response.dto';
import { CreateClientRequestDto } from './dto/create-client-request.dto';

@ApiTags('Clients')
@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client', operationId: 'createClient' })
  @ApiOkResponse({ type: CreateClientResponseDto })
  async createClient(@Body() createClientDto: CreateClientRequestDto): Promise<CreateClientResponseDto> {
    return this.clientService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Gets a list of all enabled quotations', operationId: 'findClients' })
  @ApiOkResponse({ type: [HealthOrderResponseDto] })
  async findClients(
    @Query() filterDto: FilterHealthOrderDto,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<PageResponseDto<HealthOrderResponseDto>> {
    return this.clientService.findOrders(filterDto, pageOptionsDto);
  }

  @Get('/:id')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({ summary: 'Gets details of an specific order', operationId: 'findClient' })
  @ApiOkResponse({ type: HealthOrderResponseDto })
  async findClient(@Param('id') id): Promise<HealthOrderResponseDto> {
    return this.clientService.findOrder(id);
  }

  @Put('/:id')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({ summary: 'Updates an specific quotation', operationId: 'updateClient' })
  @ApiOkResponse({ type: HealthOrderResponseDto })
  async updateClient(
    @Param('id') id,
    @Body() updateQuotationDto: UpdateHealthOrderRequestDto,
  ): Promise<HealthOrderResponseDto> {
    return this.clientService.update(id, updateQuotationDto);
  }
}

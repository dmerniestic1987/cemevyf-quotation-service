import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateProviderRequestDto } from './dto/create-provider-request.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProviderResponseDto } from './dto/provider-response.dto';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { QuotationsRepository } from './quotations.repository';

@ApiTags('quotations')
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly providersRepository: QuotationsRepository) {}

  @Post()
  @ApiOperation({ summary: 'Create a new provider', operationId: 'createProvider' })
  @ApiOkResponse({ type: ProviderResponseDto })
  async create(@Body() createProviderDto: CreateProviderRequestDto): Promise<ProviderResponseDto> {
    return this.providersRepository.createProvider(createProviderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Gets a list of all enabled providers', operationId: 'findAllProviders' })
  @ApiOkResponse({ type: [ProviderResponseDto] })
  async findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageResponseDto<ProviderResponseDto>> {
    return this.providersRepository.findAllProviders(pageOptionsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find an enabled provider', operationId: 'findProvider' })
  async findOne(@Param('id') id: number): Promise<ProviderResponseDto> {
    const provider = await this.providersRepository.findOneProvider(id);
    return ProviderResponseDto.fromProvider(provider);
  }
}

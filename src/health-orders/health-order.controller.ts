import { Body, Controller, Get, Param, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CreateHealthOrderRequestDto } from './dto/create-health-order-request.dto';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { HealthOrderResponseDto } from './dto/health-order-response.dto';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { HealthOrderService } from './health-order.service';
import { FilterHealthOrderDto } from './dto/filter-health-order.dto';
import { UpdateHealthOrderRequestDto } from './dto/update-health-order-request.dto';
import { SendHealthOrderEMailRequestDto } from './dto/send-health-order-e-mail-request.dto';
import { HealthOrderEmailSentResponseDto } from './dto/health-order-email-sent-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseHealthOrderFilePipeDocument } from '../commons/validator/parse-health-order-file-pipe-document';
import { AdditionalDataDto } from './dto/additional-data.dto';
import { inputFileSchema } from './types/input-file-schema';

@ApiTags('health-orders')
@Controller('health-orders')
export class HealthOrderController {
  constructor(private readonly healthOrderService: HealthOrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new health order', operationId: 'createHealthOrder' })
  @ApiOkResponse({ type: HealthOrderResponseDto })
  async create(@Body() createProviderDto: CreateHealthOrderRequestDto): Promise<HealthOrderResponseDto> {
    return this.healthOrderService.create(createProviderDto);
  }

  @Post('/:id/execution')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({ summary: 'Marks a health order as executed', operationId: 'executeHealthOrder' })
  @ApiOkResponse({ type: HealthOrderResponseDto })
  async executeHealthOrder(@Param('id') id: number): Promise<HealthOrderResponseDto> {
    return this.healthOrderService.execute(id);
  }

  @Get()
  @ApiOperation({ summary: 'Gets a list of all enabled health orders', operationId: 'findHealthOrders' })
  @ApiOkResponse({ type: [HealthOrderResponseDto] })
  async findHealthOrders(
    @Query() filterDto: FilterHealthOrderDto,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<PageResponseDto<HealthOrderResponseDto>> {
    return this.healthOrderService.findOrders(filterDto, pageOptionsDto);
  }

  @Get('/:id')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({ summary: 'Gets details of an specific health order', operationId: 'findHealthOrder' })
  @ApiOkResponse({ type: HealthOrderResponseDto })
  async findHealthOrder(@Param('id') id: number): Promise<HealthOrderResponseDto> {
    return this.healthOrderService.findOrder(id);
  }

  @Put('/:id')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({ summary: 'Updates an specific health order', operationId: 'updateHealthOrder' })
  @ApiOkResponse({ type: HealthOrderResponseDto })
  async updateHealthOrder(
    @Param('id') id: number,
    @Body() updateQuotationDto: UpdateHealthOrderRequestDto,
  ): Promise<HealthOrderResponseDto> {
    return this.healthOrderService.update(id, updateQuotationDto);
  }

  @Post('/:id/prescription/e-mail')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({
    summary: 'Send a e-mail with health order prescription to the client',
    operationId: 'sendHealthOrderPrescriptionToClient',
  })
  @ApiOkResponse({ type: HealthOrderEmailSentResponseDto })
  async sendHealthOrderPrescriptionToClient(
    @Param('id') id: number,
    @Body() sendDto: SendHealthOrderEMailRequestDto,
  ): Promise<HealthOrderEmailSentResponseDto> {
    return this.healthOrderService.sendHealthOrderPrescriptionToClient(id, sendDto);
  }

  @Post('/:id/results/e-mail')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({
    summary: 'Send a e-mail with health order results to the client',
    operationId: 'sendHealthOrderResultsToClient',
  })
  @ApiOkResponse({ type: HealthOrderEmailSentResponseDto })
  async sendHealthOrderResultsToClient(
    @Param('id') id: number,
    @Body() sendDto: SendHealthOrderEMailRequestDto,
  ): Promise<HealthOrderEmailSentResponseDto> {
    return this.healthOrderService.sendHealthOrderResultsToClient(id, sendDto);
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('/:id/prescription')
  @ApiOperation({
    summary: 'Adds a prescription file to a health order. The file could be jpg, png or pdf file',
    operationId: 'attachHealthOrderPrescription',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: inputFileSchema,
  })
  async attachHealthOrderPrescription(
    @Param('id') id: number,
    @UploadedFile(new ParseHealthOrderFilePipeDocument())
    file: Express.Multer.File,
    @Body() dto: AdditionalDataDto,
  ) {
    const fileId = await this.healthOrderService.attachHealthOrderPrescription(id, file, dto.additionalNotes);
    return {
      id: fileId,
      filename: file.filename,
    };
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('/:id/results')
  @ApiOperation({
    summary: 'Adds a result file to a health order. The file could be jpg, png or pdf file',
    operationId: 'attachHealthOrderResult',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: inputFileSchema,
  })
  async attachHealthOrderResult(
    @Param('id') id: number,
    @UploadedFile(new ParseHealthOrderFilePipeDocument())
    file: Express.Multer.File,
    @Body() dto: AdditionalDataDto,
  ) {
    const fileId = await this.healthOrderService.attachResultFile(id, file, dto.additionalNotes);
    return {
      id: fileId,
      filename: file.filename,
    };
  }
}

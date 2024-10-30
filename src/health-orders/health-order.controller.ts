import {
  Body,
  Controller, FileTypeValidator,
  Get, MaxFileSizeValidator,
  Param, ParseFilePipe,
  ParseFilePipeBuilder,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
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

  @Post('/:id/message')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({
    summary: 'Send a message with health order to the client',
    operationId: 'sendHealthOrder',
  })
  @ApiOkResponse({ type: HealthOrderEmailSentResponseDto })
  async sendHealthOrderToClient(
    @Param('id') id: number,
    @Body() sendDto: SendHealthOrderEMailRequestDto,
  ): Promise<HealthOrderEmailSentResponseDto> {
    return this.healthOrderService.sendHealthOrderToClient(id, sendDto);
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('/:id/file')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file']
    },
  })
  async uploadFileAndPassValidation(
    @Param('id') id: number,
    @UploadedFile(
      new ParseHealthOrderFilePipeDocument(),
    )
      file: Express.Multer.File,
  ) {
    const fileId = await this.healthOrderService.attachHealthOrderFile(id, file);
    return {
      id: fileId,
      filename: file.filename,
    };
  }
}

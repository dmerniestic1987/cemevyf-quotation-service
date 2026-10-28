import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { CreateHealthOrderRequestDto } from './dto/create-health-order-request.dto';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { HealthOrderResponseDto } from './dto/health-order-response.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { HealthOrderService } from './health-order.service';
import { FilterHealthOrderDto } from './dto/filter-health-order.dto';
import { UpdateHealthOrderRequestDto } from './dto/update-health-order-request.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  MAX_FILE_SIZE_IN_BYTES,
  ParseHealthOrderFilePipeDocument,
} from '../commons/validator/parse-health-order-file-pipe-document';
import { AdditionalDataDto } from './dto/additional-data.dto';
import { inputFileSchema } from './types/input-file-schema';
import { UpdateHealthOrderStatusRequestDto } from './dto/update-health-order-status-request.dto';
import { BulkUpdateHealthOrderStatusRequestDto } from './dto/bulk-update-health-order-status-request.dto';
import { AttachedFileResponseDto } from './dto/attached-file-response.dto';
import { HealthOrderFileResponseDto } from './dto/health-order-file-response.dto';

// Multer keeps the upload in memory, so the limit aborts oversized requests (413) before they are fully buffered
const FILE_UPLOAD_OPTIONS = { limits: { fileSize: MAX_FILE_SIZE_IN_BYTES, files: 1 } };

@ApiTags('health-orders')
@Controller('health-orders')
export class HealthOrderController {
  constructor(private readonly healthOrderService: HealthOrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new health order', operationId: 'createHealthOrder' })
  @ApiOkResponse({ type: HealthOrderResponseDto })
  async create(@Body() createHealthOrderDto: CreateHealthOrderRequestDto): Promise<HealthOrderResponseDto> {
    return this.healthOrderService.create(createHealthOrderDto);
  }

  @Patch('/:id/status')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({
    summary: 'Updates the status of the order',
    operationId: 'updateHealthOrderStatus',
    description:
      'The health orders have four possible statuses: quoted, executed, results pending, and results ready. This endpoint validates and updates an order',
  })
  @ApiOkResponse({ type: HealthOrderResponseDto })
  async updateHealthOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateHealthOrderStatusRequestDto,
  ): Promise<HealthOrderResponseDto> {
    return this.healthOrderService.updateHealthOrderStatus(id, updateStatusDto.status);
  }

  @Patch('/status/bulk')
  @ApiOperation({
    summary: 'Updates the status of several health orders at once',
    operationId: 'bulkUpdateHealthOrderStatus',
    description:
      'Moves every health order in ids to the given status with the same transition rules as the single update. ' +
      'The operation is transactional: if any order does not exist (404) or cannot move to the status (400), ' +
      'no order is updated and the response details tell which ones are the problem.',
  })
  @ApiOkResponse({ type: [HealthOrderResponseDto] })
  async bulkUpdateHealthOrderStatus(
    @Body() bulkUpdateStatusDto: BulkUpdateHealthOrderStatusRequestDto,
  ): Promise<HealthOrderResponseDto[]> {
    return this.healthOrderService.bulkUpdateHealthOrderStatus(bulkUpdateStatusDto.ids, bulkUpdateStatusDto.status);
  }

  @Get()
  @ApiOperation({ summary: 'Gets a list of all enabled health orders', operationId: 'findHealthOrders' })
  @ApiOkResponse({ type: [HealthOrderResponseDto] })
  async findHealthOrders(@Query() filterDto: FilterHealthOrderDto): Promise<PageResponseDto<HealthOrderResponseDto>> {
    return this.healthOrderService.findOrders(filterDto, filterDto);
  }

  @Get('/:id')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({ summary: 'Gets details of an specific health order', operationId: 'findHealthOrder' })
  @ApiOkResponse({ type: HealthOrderResponseDto })
  async findHealthOrder(@Param('id', ParseIntPipe) id: number): Promise<HealthOrderResponseDto> {
    return this.healthOrderService.findOrder(id);
  }

  @Put('/:id')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({ summary: 'Updates an specific health order', operationId: 'updateHealthOrder' })
  @ApiOkResponse({ type: HealthOrderResponseDto })
  async updateHealthOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHealthOrderDto: UpdateHealthOrderRequestDto,
  ): Promise<HealthOrderResponseDto> {
    return this.healthOrderService.update(id, updateHealthOrderDto);
  }

  @UseInterceptors(FileInterceptor('file', FILE_UPLOAD_OPTIONS))
  @Post('/:id/prescription')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({
    summary: 'Adds a prescription file to a health order. The file could be jpg, png or pdf file',
    description: "Allowed while the health order is in any status except 'results_done'.",
    operationId: 'attachHealthOrderPrescription',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: inputFileSchema,
  })
  @ApiOkResponse({ type: AttachedFileResponseDto })
  async attachHealthOrderPrescription(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(new ParseHealthOrderFilePipeDocument())
    file: Express.Multer.File,
    @Body() dto: AdditionalDataDto,
  ): Promise<AttachedFileResponseDto> {
    const fileId = await this.healthOrderService.attachHealthOrderPrescription(id, file, dto.additionalNotes);
    return {
      id: fileId,
      originalName: file.originalname,
    };
  }

  @Get('/:id/files')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({ summary: 'Lists the files attached to a health order', operationId: 'findHealthOrderFiles' })
  @ApiOkResponse({ type: [HealthOrderFileResponseDto] })
  async findHealthOrderFiles(@Param('id', ParseIntPipe) id: number): Promise<HealthOrderFileResponseDto[]> {
    return this.healthOrderService.findOrderFiles(id);
  }

  @Get('/:id/files/:fileId')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiParam({ type: 'string', name: 'fileId' })
  @ApiOperation({ summary: 'Downloads a file attached to a health order', operationId: 'downloadHealthOrderFile' })
  @ApiProduces('application/pdf', 'image/png', 'image/jpeg')
  async downloadHealthOrderFile(
    @Param('id', ParseIntPipe) id: number,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.healthOrderService.downloadOrderFile(id, fileId);
    response.set({
      'Content-Type': file.mimeType,
      'Content-Length': String(file.sizeBytes),
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(file.stream);
  }

  @Delete('/:id/files/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ type: 'number', name: 'id' })
  @ApiParam({ type: 'string', name: 'fileId' })
  @ApiOperation({
    summary: 'Deletes a file (prescription or result) attached to a health order',
    operationId: 'deleteHealthOrderFile',
    description:
      "Removes the file record and the file stored on the server. Only allowed while the health order is in 'quoted' " +
      "or 'pending_results' status.",
  })
  @ApiNoContentResponse({ description: 'The file was deleted' })
  @ApiNotFoundResponse({ description: 'The health order does not exist or the file does not belong to it' })
  @ApiBadRequestResponse({ description: 'The health order status does not allow deleting files' })
  async deleteHealthOrderFile(
    @Param('id', ParseIntPipe) id: number,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<void> {
    await this.healthOrderService.deleteOrderFile(id, fileId);
  }

  @UseInterceptors(FileInterceptor('file', FILE_UPLOAD_OPTIONS))
  @Post('/:id/results')
  @ApiParam({ type: 'number', name: 'id' })
  @ApiOperation({
    summary: 'Adds a result file to a health order. The file could be jpg, png or pdf file',
    description: "Allowed while the health order is in any status except 'results_done'.",
    operationId: 'attachHealthOrderResult',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: inputFileSchema,
  })
  @ApiOkResponse({ type: AttachedFileResponseDto })
  async attachHealthOrderResult(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(new ParseHealthOrderFilePipeDocument())
    file: Express.Multer.File,
    @Body() dto: AdditionalDataDto,
  ): Promise<AttachedFileResponseDto> {
    const fileId = await this.healthOrderService.attachResultFile(id, file, dto.additionalNotes);
    return {
      id: fileId,
      originalName: file.originalname,
    };
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { HealthOrderRepository } from './health-order.repository';
import { CreateHealthOrderRequestDto } from './dto/create-health-order-request.dto';
import { HealthOrderResponseDto } from './dto/health-order-response.dto';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from '../clients/client.entity';
import { And, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { CemevyfMessageService } from '../external-services/cemevyf-message-service/cemevyf-message.service';
import { BaseService } from '../commons/service/base-service';
import { FilterHealthOrderDto } from './dto/filter-health-order.dto';
import { HealthOrderEntityDtoMapper } from './dto/mapper/health-order-entity-dto-mapper';
import { UpdateHealthOrderRequestDto } from './dto/update-health-order-request.dto';
import { healthOrderIncorrectStatusError, notFoundError } from '../commons/errors/exceptions';
import { HealthOrder } from './health-order.entity';
import { IHealthOrderService } from './i-health-order.service';
import { HealthOrderStatus } from './types/health-order-status';
import { HealthOrderFileType } from './types/health-order-file-type';
import { HealthOrderMailUtils } from './health-order-mail-utils';
import { ItemHealthOrderRequestDto } from './dto/item-health-order-request.dto';
import { computeTotal } from '../commons/utils/money';
import { FILE_STORAGE, FileStorage } from '../commons/file-storage/file-storage';
import { detectFileType } from '../commons/file-storage/detect-file-type';
import { HealthOrderFileResponseDto } from './dto/health-order-file-response.dto';
import { HealthOrderFileDownload } from './types/health-order-file-download';

@Injectable()
export class HealthOrderService
  extends BaseService<HealthOrder, CreateHealthOrderRequestDto>
  implements IHealthOrderService
{
  private logger = new Logger(HealthOrderService.name);
  constructor(
    private readonly healthOrderRepository: HealthOrderRepository,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    private readonly messageService: CemevyfMessageService,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: FileStorage,
  ) {
    super();
  }

  async create(orderDto: CreateHealthOrderRequestDto): Promise<HealthOrderResponseDto> {
    this.logger.debug('Create health order', { service: HealthOrderService.name, createQuotationRequestDto: orderDto });
    const client: Client = await this.clientsRepository.findOne({
      where: {
        id: orderDto.clientId,
      },
      relations: {},
    });
    if (!client) {
      throw notFoundError('Client not found');
    }

    let healthOrder: HealthOrder = new HealthOrder();
    healthOrder.currency = orderDto.currency;
    healthOrder.client = client;
    this.setHealthOrderItems(healthOrder, orderDto.quotationItems);

    healthOrder = await this.healthOrderRepository.createHealthOrder(healthOrder);
    let sentMail = false;
    if (client.email) {
      sentMail = await this.messageService.sendMail(
        HealthOrderMailUtils.toCemevyfMailMessage(client.email, healthOrder),
      );
    }
    return HealthOrderEntityDtoMapper.healthOrderEntityToResponseDto(healthOrder, sentMail);
  }

  async findOrders(
    filterDto: FilterHealthOrderDto,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageResponseDto<HealthOrderResponseDto>> {
    this.logger.debug('Find Health Orders', { service: HealthOrderService.name, filterDto, pageOptionsDto });
    const where = {};
    if (filterDto.id) {
      where['id'] = filterDto.id;
    }

    if (filterDto.dateFrom && filterDto.dateTo) {
      where['createdAt'] = And(
        MoreThanOrEqual(new Date(filterDto.dateFrom)),
        LessThanOrEqual(new Date(filterDto.dateTo)),
      );
    }

    if (filterDto.dateFrom && !filterDto.dateTo) {
      where['createdAt'] = MoreThanOrEqual(new Date(filterDto.dateFrom));
    }

    if (!filterDto.dateFrom && filterDto.dateTo) {
      where['createdAt'] = LessThanOrEqual(new Date(filterDto.dateTo));
    }

    if (filterDto.currency) {
      where['currency'] = filterDto.currency;
    }

    if (filterDto.status) {
      where['status'] = filterDto.status;
    }

    return super.findAndPaginate(
      pageOptionsDto,
      this.healthOrderRepository.getRepository(),
      where,
      { client: true },
      HealthOrderEntityDtoMapper.healthOrderEntityToResponseDto,
    );
  }

  async findOrder(id: number): Promise<HealthOrderResponseDto> {
    this.logger.debug('Find Health Order', { service: HealthOrderService.name, id });
    const quotation = await this.healthOrderRepository.getHealthOrderAndFail(id);
    return HealthOrderEntityDtoMapper.healthOrderEntityToResponseDto(quotation);
  }

  async update(id: number, updateDto: UpdateHealthOrderRequestDto): Promise<HealthOrderResponseDto> {
    this.logger.log('Update Health Order', { service: HealthOrderService.name, id });
    let healthOrder = await this.healthOrderRepository.getHealthOrderAndFail(id);
    if (updateDto.currency) {
      healthOrder.currency = updateDto.currency;
    }

    const replaceItems = Boolean(updateDto.orderItems);
    if (replaceItems) {
      this.setHealthOrderItems(healthOrder, updateDto.orderItems);
    }

    healthOrder = await this.healthOrderRepository.updateHealthOrder(healthOrder, replaceItems);
    return HealthOrderEntityDtoMapper.healthOrderEntityToResponseDto(healthOrder);
  }

  async updateHealthOrderStatus(id: number, newStatus: HealthOrderStatus): Promise<HealthOrderResponseDto> {
    this.logger.log('Update health order status', { service: HealthOrderService.name, id, newStatus });
    const healthOrder = await this.healthOrderRepository.updateHealthOrderStatus(id, newStatus);
    return HealthOrderEntityDtoMapper.healthOrderEntityToResponseDto(healthOrder);
  }

  async bulkUpdateHealthOrderStatus(ids: number[], newStatus: HealthOrderStatus): Promise<HealthOrderResponseDto[]> {
    this.logger.log('Bulk update health order status', { service: HealthOrderService.name, ids, newStatus });
    const healthOrders = await this.healthOrderRepository.bulkUpdateHealthOrderStatus(ids, newStatus);
    // An arrow function is needed: the mapper's second parameter would receive the array index otherwise
    return healthOrders.map(healthOrder => HealthOrderEntityDtoMapper.healthOrderEntityToResponseDto(healthOrder));
  }

  async attachHealthOrderPrescription(
    orderId: number,
    file: Express.Multer.File,
    additionalNotes: string,
  ): Promise<string> {
    this.logger.log('Attach file to health order', { service: HealthOrderService.name, orderId });
    await this.assertFilesCanBeAttached(orderId);
    return this.storeAndAttachFile(orderId, file, additionalNotes, HealthOrderFileType.HEALTH_ORDER_PRESCRIPTION);
  }

  async attachResultFile(orderId: number, file: Express.Multer.File, additionalNotes: string): Promise<string> {
    this.logger.log('Attach result file', { service: HealthOrderService.name, orderId });
    await this.assertFilesCanBeAttached(orderId);
    return this.storeAndAttachFile(orderId, file, additionalNotes, HealthOrderFileType.HEALTH_ORDER_RESULT);
  }

  async findOrderFiles(orderId: number): Promise<HealthOrderFileResponseDto[]> {
    this.logger.debug('Find health order files', { service: HealthOrderService.name, orderId });
    await this.healthOrderRepository.getHealthOrderAndFail(orderId, {});
    const files = await this.healthOrderRepository.findHealthOrderFiles(orderId);
    return files.map(HealthOrderEntityDtoMapper.healthOrderFileToResponseDto);
  }

  async downloadOrderFile(orderId: number, fileId: string): Promise<HealthOrderFileDownload> {
    this.logger.debug('Download health order file', { service: HealthOrderService.name, orderId, fileId });
    const file = await this.healthOrderRepository.findHealthOrderFile(orderId, fileId);
    if (!file) {
      throw notFoundError(`File ID: ${fileId} was not found in Health Order ID: ${orderId}`);
    }
    return {
      stream: await this.fileStorage.createReadStream(file.storedFileName),
      mimeType: file.mimeType,
      originalName: file.originalName,
      sizeBytes: file.sizeBytes,
    };
  }

  /**
   * Files can be attached to a health order in any status except when its results are already done.
   */
  private async assertFilesCanBeAttached(orderId: number): Promise<void> {
    const healthOrder = await this.healthOrderRepository.getHealthOrderAndFail(orderId, {});
    if (healthOrder.status === HealthOrderStatus.RESULTS_DONE) {
      throw healthOrderIncorrectStatusError(
        `Files cannot be attached to a health order in '${HealthOrderStatus.RESULTS_DONE}' status`,
      );
    }
  }

  /**
   * Writes the file to the storage and registers it in the database. If the registration fails the stored file is
   * removed, so no orphan file is left on disk.
   */
  private async storeAndAttachFile(
    orderId: number,
    file: Express.Multer.File,
    additionalNotes: string,
    fileType: HealthOrderFileType,
  ): Promise<string> {
    const detectedType = detectFileType(file.buffer);
    const storedFileName = await this.fileStorage.save(file.buffer, detectedType.extension);
    try {
      return await this.healthOrderRepository.attachHealthOrderFile(orderId, {
        mimeType: detectedType.mimeType,
        storedFileName,
        originalName: file.originalname,
        sizeBytes: file.buffer.length,
        checksumSha256: createHash('sha256').update(file.buffer).digest('hex'),
        additionalNotes,
        fileType,
      });
    } catch (error) {
      await this.fileStorage.delete(storedFileName).catch(deleteError => {
        this.logger.error(`Could not remove stored file ${storedFileName} after a failed insert`, deleteError);
      });
      throw error;
    }
  }

  /**
   * Replaces the items of the health order and recomputes its total amount on the server side.
   */
  private setHealthOrderItems(healthOrder: HealthOrder, itemDtos: ItemHealthOrderRequestDto[]): void {
    healthOrder.healthOrderItems = itemDtos.map((itemDto, itemIndex) => {
      const item = HealthOrderEntityDtoMapper.healthOrderItemRequestDtoToItemDto(itemDto, itemIndex);
      item.healthOrder = healthOrder;
      item.orderId = healthOrder.id;
      return item;
    });
    healthOrder.totalAmount = Number(computeTotal(itemDtos));
  }
}

import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { HealthOrderRepository } from './health-order.repository';
import { CreateHealthOrderRequestDto } from './dto/create-health-order-request.dto';
import { HealthOrderResponseDto } from './dto/health-order-response.dto';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from '../clients/client.entity';
import { And, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import {
  CemevyfMessageService,
} from '../external-services/cemevyf-message-service/cemevyf-message.service';
import { BaseService } from '../commons/service/base-service';
import { FilterHealthOrderDto } from './dto/filter-health-order.dto';
import { HealthOrderEntityDtoMapper } from './dto/mapper/health-order-entity-dto-mapper';
import { UpdateHealthOrderRequestDto } from './dto/update-health-order-request.dto';
import { SendHealthOrderEMailRequestDto } from './dto/send-health-order-e-mail-request.dto';
import { HealthOrderEmailSentResponseDto } from './dto/health-order-email-sent-response.dto';
import { MessageChannelEnum } from '../commons/types/message-channel.enum';
import {
  featureNotImplementedError,
  healthOrderIncorrectStatusError,
  notFoundError,
} from '../commons/errors/exceptions';
import { HealthOrder } from './health-order.entity';
import { IHealthOrderService } from './i-health-order.service';
import { HealthOrderStatus } from './types/health-order-status';
import { HealthOrderFileType } from './types/health-order-file-type';
import { HealthOrderMailUtils } from './health-order-mail-utils';

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
  ) {
    super();
  }

  async create(orderDto: CreateHealthOrderRequestDto): Promise<HealthOrderResponseDto> {
    this.logger.debug('Create health order', { service: HealthOrderService.name, createQuotationRequestDto: orderDto });
    const client: Client = await this.clientsRepository.findOne({
      where: {
        id: orderDto.clientId,
      },
      relations: [],
    });
    if (!client) {
      throw notFoundError('Client not found');
    }

    let healthOrder: HealthOrder = new HealthOrder();
    healthOrder.totalAmount = Number(orderDto.totalAmount); //TODO: Transform to BigDecimal
    healthOrder.currency = orderDto.currency;
    healthOrder.healthOrderItems = [];
    healthOrder.client = client;
    orderDto.quotationItems.forEach((itemDto, itemIndex) => {
      const item = HealthOrderEntityDtoMapper.healthOrderItemRequestDtoToItemDto(itemDto, itemIndex);
      item.healthOrder = healthOrder;
      item.orderId = healthOrder.id;
      healthOrder.healthOrderItems.push(item);
    });

    healthOrder = await this.healthOrderRepository.createHealthOrder(healthOrder);
    let sentMail = false;
    if (client.email) {
      sentMail = await this.messageService.sendMail(HealthOrderMailUtils.toCemevyfMailMessage(client.email, healthOrder));
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

    return super.findAndPaginate(
      pageOptionsDto,
      this.healthOrderRepository.getRepository(),
      where,
      undefined,
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
    if (updateDto.totalAmount) {
      healthOrder.totalAmount = Number(updateDto.totalAmount);
    }
    if (updateDto.currency) {
      healthOrder.currency = updateDto.currency;
    }

    if (updateDto.orderItems) {
      healthOrder.healthOrderItems = [];
      updateDto.orderItems.forEach((itemDto, itemIndex) => {
        const quotationItem = HealthOrderEntityDtoMapper.healthOrderItemRequestDtoToItemDto(itemDto, itemIndex);
        quotationItem.healthOrder = healthOrder;
        quotationItem.orderId = healthOrder.id;
        healthOrder.healthOrderItems.push(quotationItem);
      });
    }

    healthOrder = await this.healthOrderRepository.updateHealthOrder(healthOrder);
    return HealthOrderEntityDtoMapper.healthOrderEntityToResponseDto(healthOrder);
  }

  async sendHealthOrderQuotationToClient(
    id: number,
    sendQuotationDto: SendHealthOrderEMailRequestDto,
  ): Promise<HealthOrderEmailSentResponseDto> {
    this.logger.log('Send Message With Quotation', { service: HealthOrderService.name, id });
    if (sendQuotationDto.channel !== MessageChannelEnum.E_MAIL) {
      throw featureNotImplementedError(`Sending messages by ${sendQuotationDto.channel} is not implemented`);
    }
    const quotation = await this.healthOrderRepository.getHealthOrderAndFail(id, ['client', 'healthOrderItems']);

    const sentMail = await this.messageService.sendMail(HealthOrderMailUtils.toCemevyfMailMessage(sendQuotationDto.eMail, quotation));
    return {
      id,
      channel: sendQuotationDto.channel,
      sentMail,
    };
  }

  async execute(id: number): Promise<HealthOrderResponseDto> {
    this.logger.log('Execute order', { service: HealthOrderService.name, id });
    let healthOrder = await this.healthOrderRepository.getHealthOrderAndFail(id, []);
    if (healthOrder.status !== HealthOrderStatus.QUOTED) {
      throw healthOrderIncorrectStatusError();
    }
    healthOrder = await this.healthOrderRepository.executeOrder(id);
    return HealthOrderEntityDtoMapper.healthOrderEntityToResponseDto(healthOrder);
  }

  async attachHealthOrderPrescription(orderId: number, file: Express.Multer.File, additionalNotes: string): Promise<string> {
    this.logger.log('Attach file to health order', { service: HealthOrderService.name, orderId });
    const healthOrder = await this.healthOrderRepository.getHealthOrderAndFail(orderId, []);
    if (healthOrder.status === HealthOrderStatus.RESULTS_DONE) {
      throw healthOrderIncorrectStatusError();
    }
    return this.healthOrderRepository.attachHealthOrderFile(orderId, {
      fileData: file.buffer,
      additionalNotes,
      mimeType: file.mimetype,
      fileType: HealthOrderFileType.HEALTH_ORDER_PRESCRIPTION,
    });
  }

  async attachResultFile(orderId: number, file: Express.Multer.File, additionalNotes: string): Promise<string> {
    const healthOrder = await this.healthOrderRepository.getHealthOrderAndFail(orderId, []);
    if (healthOrder.status !== HealthOrderStatus.EXECUTED) {
      throw healthOrderIncorrectStatusError();
    }

    return this.healthOrderRepository.attachHealthOrderFile(orderId, {
      fileData: file.buffer,
      additionalNotes,
      mimeType: file.mimetype,
      fileType: HealthOrderFileType.HEALTH_ORDER_RESULT,
    });
  }

  sendResultFilesEmail(id: number): Promise<any> {
    throw new NotImplementedException(`Service not implemented ID: ${id}`)
  }
}

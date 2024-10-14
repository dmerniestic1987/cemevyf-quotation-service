import { Injectable, Logger } from '@nestjs/common';
import { HealthOrderRepository } from './health-order.repository';
import { CreateHealthOrderRequestDto } from './dto/create-health-order-request.dto';
import { HealthOrderResponseDto } from './dto/health-order-response.dto';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from '../clients/client.entity';
import { And, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import {
  CemevyfMailMessage,
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
    this.logger.log('Create Quotation', { service: HealthOrderService.name, createQuotationRequestDto: orderDto });
    const client: Client = await this.clientsRepository.findOne({
      where: {
        id: orderDto.clientId,
      },
      relations: ['healthOrders'],
    });
    if (!client) {
      throw notFoundError('Client not found');
    }

    let quotation: HealthOrder = new HealthOrder();
    quotation.totalAmount = Number(orderDto.totalAmount); //TODO: Transform to BigDecimal
    quotation.currency = orderDto.currency;
    quotation.healthOrderItems = [];
    quotation.client = client;
    orderDto.quotationItems.forEach((itemDto, itemIndex) => {
      const item = HealthOrderEntityDtoMapper.quotationItemRequestDtoToQuotationItemDto(itemDto, itemIndex);
      item.quotation = quotation;
      item.quotationId = quotation.id;
      quotation.healthOrderItems.push(item);
    });

    if (!client.healthOrders) {
      client.healthOrders = [];
    }
    client.healthOrders.push(quotation);

    quotation = await this.healthOrderRepository.createHealthOrder(quotation, client);
    let sentMail = false;
    if (client.email) {
      sentMail = await this.messageService.sendMail(this.toCemevyfMailMessage(client.email, quotation));
    }
    return HealthOrderEntityDtoMapper.quotationEntityToQuotationResponseDto(quotation, sentMail);
  }

  async findOrders(
    filterDto: FilterHealthOrderDto,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageResponseDto<HealthOrderResponseDto>> {
    this.logger.log('Find Health Orders', { service: HealthOrderService.name, filterDto, pageOptionsDto });
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
      HealthOrderEntityDtoMapper.quotationEntityToQuotationResponseDto,
    );
  }

  async findOrder(id: number): Promise<HealthOrderResponseDto> {
    this.logger.log('Find Quotation', { service: HealthOrderService.name, id });
    const quotation = await this.healthOrderRepository.getHealthOrderAndFail(id);
    return HealthOrderEntityDtoMapper.quotationEntityToQuotationResponseDto(quotation);
  }

  async update(id: number, updateQuotationDto: UpdateHealthOrderRequestDto): Promise<HealthOrderResponseDto> {
    this.logger.log('Update Quotation', { service: HealthOrderService.name, id });
    let quotation = await this.healthOrderRepository.getHealthOrderAndFail(id);
    if (updateQuotationDto.totalAmount) {
      quotation.totalAmount = Number(updateQuotationDto.totalAmount);
    }
    if (updateQuotationDto.currency) {
      quotation.currency = updateQuotationDto.currency;
    }

    if (updateQuotationDto.orderItems) {
      quotation.healthOrderItems = [];
      updateQuotationDto.orderItems.forEach((itemDto, itemIndex) => {
        const quotationItem = HealthOrderEntityDtoMapper.quotationItemRequestDtoToQuotationItemDto(itemDto, itemIndex);
        quotationItem.quotation = quotation;
        quotationItem.quotationId = quotation.id;
        quotation.healthOrderItems.push(quotationItem);
      });
    }

    quotation = await this.healthOrderRepository.updateQuotation(quotation);
    return HealthOrderEntityDtoMapper.quotationEntityToQuotationResponseDto(quotation);
  }

  async sendHealthOrderEMail(
    id: number,
    sendQuotationDto: SendHealthOrderEMailRequestDto,
  ): Promise<HealthOrderEmailSentResponseDto> {
    this.logger.log('Send Message With Quotation', { service: HealthOrderService.name, id });
    if (sendQuotationDto.channel !== MessageChannelEnum.E_MAIL) {
      throw featureNotImplementedError(`Sending messages by ${sendQuotationDto.channel} is not implemented`);
    }
    const quotation = await this.healthOrderRepository.getHealthOrderAndFail(id, ['client', 'healthOrderItems']);

    const sentMail = await this.messageService.sendMail(this.toCemevyfMailMessage(sendQuotationDto.eMail, quotation));
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
    return HealthOrderEntityDtoMapper.quotationEntityToQuotationResponseDto(healthOrder);
  }

  attachFile(id: number, fileBase64: string): Promise<any> {
    return null;
  }

  attachResultFile(id: number, fileBase64: string): Promise<any> {
    return null;
  }

  sendResultFilesEmail(id: number): Promise<any> {
    return null;
  }

  private toCemevyfMailMessage(
    eMail: string,
    quotation: HealthOrder,
    subject = 'CEMEVYF - Cotización de estudios médicos',
  ): CemevyfMailMessage {
    const items =
      quotation.healthOrderItems?.map(quotationItem => {
        return {
          id: quotationItem.id,
          code: quotationItem.code,
          name: quotationItem.name,
          itemCount: quotationItem.itemCount,
        };
      }) || [];
    return {
      to: eMail || quotation.client.email,
      subject,
      context: {
        clientFirstName: quotation.client.firstName,
        clientLastName: quotation.client.lastName,
        createdAt: quotation.createdAt.toDateString(),
        quotationId: quotation.id,
        totalAmount: quotation.totalAmount,
        items,
      },
    };
  }
}

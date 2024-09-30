import { Injectable, Logger } from '@nestjs/common';
import { HealthOrderRepository } from './health-order.repository';
import { CreateQuotationRequestDto } from './dto/create-quotation-request.dto';
import { QuotationResponseDto } from './dto/quotation-response.dto';
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
import { FilterQuotationDto } from './dto/filter-quotation.dto';
import { QuotationEntityDtoMapper } from './dto/mapper/quotation-entity-dto-mapper';
import { UpdateQuotationRequestDto } from './dto/update-quotation-request.dto';
import { SendQuotationByMessageRequestDto } from './dto/send-quotation-by-message-request.dto';
import { QuotationSentMessageResponseDto } from './dto/quotation-sent-message-response.dto';
import { MessageChannelEnum } from '../commons/types/message-channel.enum';
import { featureNotImplementedError } from '../commons/errors/exceptions';
import { HealthOrder } from './health-order.entity';

@Injectable()
export class HealthOrderService extends BaseService<HealthOrder, CreateQuotationRequestDto> {
  private logger = new Logger(HealthOrderService.name);
  constructor(
    private readonly quotationRepository: HealthOrderRepository,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    private readonly messageService: CemevyfMessageService,
  ) {
    super();
  }

  async createQuotation(createQuotationRequestDto: CreateQuotationRequestDto): Promise<QuotationResponseDto> {
    this.logger.log('Create Quotation', { service: HealthOrderService.name, createQuotationRequestDto });
    let client: Client = await this.clientsRepository.findOne({
      where: {
        clientId: createQuotationRequestDto.client.clientId,
        clientIdType: createQuotationRequestDto.client.clientIdType,
      },
      relations: ['quotations'],
    });
    if (!client) {
      client = new Client();
      client.clientId = createQuotationRequestDto.client.clientId;
      client.clientIdType = createQuotationRequestDto.client.clientIdType;
      client.clientFirstName = createQuotationRequestDto.client.clientFirstName;
      client.clientLastName = createQuotationRequestDto.client.clientLastName;
      client = await this.clientsRepository.save(client);
    }

    let quotation: HealthOrder = new HealthOrder();
    quotation.totalAmount = Number(createQuotationRequestDto.totalAmount); //TODO: Transform to BigDecimal
    quotation.currency = createQuotationRequestDto.currency;
    quotation.healthOrderItems = [];
    quotation.client = client;
    createQuotationRequestDto.quotationItems.forEach((itemDto, itemIndex) => {
      const item = QuotationEntityDtoMapper.quotationItemRequestDtoToQuotationItemDto(itemDto, itemIndex);
      item.quotation = quotation;
      item.quotationId = quotation.id;
      quotation.healthOrderItems.push(item);
    });

    if (!client.healthOrders) {
      client.healthOrders = [];
    }
    client.healthOrders.push(quotation);

    //TODO: Check client
    //TODO: We need to get client information from ClientService
    quotation = await this.quotationRepository.createQuotation(quotation, client);
    await this.messageService.sendMail(this.toCemevyfMailMessage(createQuotationRequestDto.eMail, quotation));
    return QuotationEntityDtoMapper.quotationEntityToQuotationResponseDto(quotation);
  }

  async findQuotations(
    filterDto: FilterQuotationDto,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageResponseDto<QuotationResponseDto>> {
    this.logger.log('Find Quotation', { service: HealthOrderService.name, filterDto, pageOptionsDto });
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
      this.quotationRepository.getRepository(),
      where,
      undefined,
      QuotationEntityDtoMapper.quotationEntityToQuotationResponseDto,
    );
  }

  async findQuotation(id: number): Promise<QuotationResponseDto> {
    this.logger.log('Find Quotation', { service: HealthOrderService.name, id });
    const quotation = await this.quotationRepository.getQuotationAndFail(id);
    return QuotationEntityDtoMapper.quotationEntityToQuotationResponseDto(quotation);
  }

  async updateQuotation(id: number, updateQuotationDto: UpdateQuotationRequestDto): Promise<QuotationResponseDto> {
    this.logger.log('Update Quotation', { service: HealthOrderService.name, id });
    let quotation = await this.quotationRepository.getQuotationAndFail(id);
    if (updateQuotationDto.totalAmount) {
      quotation.totalAmount = Number(updateQuotationDto.totalAmount);
    }
    if (updateQuotationDto.currency) {
      quotation.currency = updateQuotationDto.currency;
    }

    if (updateQuotationDto.quotationItems) {
      quotation.healthOrderItems = [];
      updateQuotationDto.quotationItems.forEach((itemDto, itemIndex) => {
        const quotationItem = QuotationEntityDtoMapper.quotationItemRequestDtoToQuotationItemDto(itemDto, itemIndex);
        quotationItem.quotation = quotation;
        quotationItem.quotationId = quotation.id;
        quotation.healthOrderItems.push(quotationItem);
      });
    }

    quotation = await this.quotationRepository.updateQuotation(quotation);
    return QuotationEntityDtoMapper.quotationEntityToQuotationResponseDto(quotation);
  }

  async deleteQuotation(id: number): Promise<boolean> {
    this.logger.log('Delete Quotation', { service: HealthOrderService.name, id });
    const quotation = await this.quotationRepository.getQuotationAndFail(id);
    const updateResult = await this.quotationRepository.getRepository().softDelete(quotation.id);
    return updateResult.affected > 0;
  }

  async sendMessageWithQuotation(
    id: number,
    sendQuotationDto: SendQuotationByMessageRequestDto,
  ): Promise<QuotationSentMessageResponseDto> {
    this.logger.log('Send Message With Quotation', { service: HealthOrderService.name, id });
    if (sendQuotationDto.channel !== MessageChannelEnum.E_MAIL) {
      throw featureNotImplementedError(`Sending messages by ${sendQuotationDto.channel} is not implemented`);
    }
    const quotation = await this.quotationRepository.getQuotationAndFail(id, ['client', 'quotationItems']);

    const sentMail = await this.messageService.sendMail(this.toCemevyfMailMessage(sendQuotationDto.eMail, quotation));
    return {
      id,
      channel: sendQuotationDto.channel,
      sentMail,
    };
  }

  private toCemevyfMailMessage(
    eMail: string,
    quotation: HealthOrder,
    subject = 'CEMEVYF - Cotización de Análisis de Laboratorio',
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
        clientFirstName: quotation.client.clientFirstName,
        clientLastName: quotation.client.clientLastName,
        createdAt: quotation.createdAt.toDateString(),
        quotationId: quotation.id,
        totalAmount: quotation.totalAmount,
        items,
      },
    };
  }
}

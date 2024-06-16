import { Injectable, Logger } from '@nestjs/common';
import { QuotationsRepository } from './quotations.repository';
import { CreateQuotationRequestDto } from './dto/create-quotation-request.dto';
import { QuotationResponseDto } from './dto/quotation-response.dto';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from '../clients/client.entity';
import { Repository } from 'typeorm';
import { Quotation } from './quotation.entity';
import { QuotationItem } from './quotation-item.entity';
import { CemevyfMessageService } from '../external-services/cemevyf-message-service/cemevyf-message.service';
import { BaseService } from '../commons/service/base-service';
import { FilterQuotationDto } from './dto/filter-quotation.dto';
import { QuotationEntityDtoMapper } from './dto/mapper/quotation-entity-dto-mapper';
import { UpdateQuotationRequestDto } from './dto/update-quotation-request.dto';

@Injectable()
export class QuotationsService extends BaseService<Quotation, CreateQuotationRequestDto> {
  private logger = new Logger(QuotationsService.name);
  constructor(
    private readonly quotationRepository: QuotationsRepository,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    private readonly messageService: CemevyfMessageService,
  ) {
    super();
  }

  async createQuotation(createQuotationRequestDto: CreateQuotationRequestDto): Promise<QuotationResponseDto> {
    this.logger.debug('Create Quotation', { service: QuotationsService.name, createQuotationRequestDto });
    let client: Client = await this.clientsRepository.findOne({
      where: {
        eMail: createQuotationRequestDto.client.eMail.toLowerCase(),
      },
      relations: ['quotations'],
    });
    if (!client) {
      client = new Client();
      client.clientId = createQuotationRequestDto.client.clientId;
      client.clientIdType = createQuotationRequestDto.client.clientIdType;
      client.clientFirstName = createQuotationRequestDto.client.clientFirstName;
      client.clientLastName = createQuotationRequestDto.client.clientLastName;
      client.eMail = createQuotationRequestDto.client.eMail.toLowerCase();
      client.phoneNumber = createQuotationRequestDto.client.phoneNumber;
      client = await this.clientsRepository.save(client);
    }

    let quotation: Quotation = new Quotation();
    quotation.totalAmount = Number(createQuotationRequestDto.totalAmount); //TODO: Transform to BigDecimal
    quotation.currency = createQuotationRequestDto.currency;
    quotation.quotationItems = [];
    quotation.client = client;
    createQuotationRequestDto.quotationItems.forEach((itemDto, itemIndex) => {
      const item = new QuotationItem();
      item.id = itemIndex;
      item.name = itemDto.name;
      item.code = itemDto.code;
      item.unitPrice = Number(itemDto.unitPrice); //TODO: Transform to BigDecimal
      item.quotation = quotation;
      item.quotationId = quotation.id;
      item.itemCount = itemDto.itemCount;
      quotation.quotationItems.push(item);
    });

    if (!client.quotations) {
      client.quotations = [];
    }
    client.quotations.push(quotation);

    //TODO: Check client
    //TODO: We need to get client information from ClientService
    quotation = await this.quotationRepository.createQuotation(quotation, client);
    await this.messageService.sendMail({
      to: client.eMail,
      subject: 'CEMEVYF - Nueva Cotización de Análisis de Laboratorio',
      context: {
        clientFirstName: client.clientFirstName,
        clientLastName: client.clientLastName,
        createdAt: quotation.createdAt.toDateString(),
        quotationId: quotation.id,
        totalAmount: quotation.totalAmount,
      },
    });
    return QuotationEntityDtoMapper.quotationEntityToQuotationResponseDto(quotation);
  }

  async findAllQuotations(
    filterDto: FilterQuotationDto,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageResponseDto<QuotationResponseDto>> {
    return super.findAll(
      pageOptionsDto,
      this.quotationRepository.getRepository(),
      undefined,
      {},
      undefined,
      QuotationEntityDtoMapper.quotationEntityToQuotationResponseDto,
    );
  }

  async findQuotation(id: number): Promise<QuotationResponseDto> {
    const quotation = await this.quotationRepository.getRepository().findOne({
      where: {
        id,
      },
      relations: ['quotationItems'],
    });

    return QuotationEntityDtoMapper.quotationEntityToQuotationResponseDto(quotation);
  }

  async updateQuotation(id: number, updateQuotationDto: UpdateQuotationRequestDto): Promise<QuotationResponseDto> {
    const quotation = await this.quotationRepository.getRepository().findOne({
      where: {
        id,
      },
      relations: ['quotationItems'],
    });
    //TODO: IMPLEMENT PARSE TO QUOTATION AND UPDATE
    return QuotationEntityDtoMapper.quotationEntityToQuotationResponseDto(quotation);
  }
}

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

@Injectable()
export class QuotationsService {
  private logger = new Logger(QuotationsService.name);
  constructor(
    private readonly quotationRepository: QuotationsRepository,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
  ) {}

  async createQuotation(createQuotationRequestDto: CreateQuotationRequestDto): Promise<QuotationResponseDto> {
    let client: Client = await this.clientsRepository.findOne({
      where: {
        eMail: createQuotationRequestDto.eMail.toLowerCase(),
      },
      relations: ['quotations'],
    });
    if (!client) {
      client = new Client();
      client.clientId = createQuotationRequestDto.clientId;
      client.clientIdType = createQuotationRequestDto.clientIdType;
      client.clientFirstName = createQuotationRequestDto.clientFirstName;
      client.clientLastName = createQuotationRequestDto.clientLastName;
      client.eMail = createQuotationRequestDto.eMail.toLowerCase();
      client.phoneNumber = createQuotationRequestDto.phoneNumber;
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
    return {
      id: quotation.id,
      itemCount: quotation.quotationItems.length,
    };
  }

  async findAll(pageOptionsDto: PageOptionsDto): Promise<PageResponseDto<QuotationResponseDto>> {
    return null;
  }
}

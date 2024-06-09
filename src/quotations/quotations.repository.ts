import { Logger } from '@nestjs/common';
import { Quotation } from './quotation.entity';
import { BaseRepository } from '../commons/repository/base-repository';
import { Repository } from 'typeorm';
import { CreateQuotationRequestDto } from './dto/create-quotation-request.dto';
import { QuotationResponseDto } from './dto/quotation-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import {Client} from "../clients/client.entity";
import {QuotationItem} from "./quotation-item.entity";

export class QuotationsRepository extends BaseRepository<Quotation, CreateQuotationRequestDto> {
  private readonly logger = new Logger(QuotationsRepository.name);
  constructor(
    @InjectRepository(Quotation)
    private readonly quotationRepository: Repository<Quotation>,
    @InjectRepository(QuotationItem)
    private readonly quotationItemsRepository: Repository<QuotationItem>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
  ) {
    super();
  }

  async createQuotation(createProviderRequestDto: CreateQuotationRequestDto): Promise<QuotationResponseDto> {
    this.logger.debug('create user', { service: QuotationsRepository.name, createProviderRequestDto });
    let client: Client = await this.clientsRepository.findOne({
      where: {
        eMail: createProviderRequestDto.eMail.toLowerCase(),
      }
    });
    if (!client) {
      client = new Client();
      client.clientId = createProviderRequestDto.clientId;
      client.clientIdType = createProviderRequestDto.clientIdType;
      client.clientFirstName = createProviderRequestDto.clientFirstName;
      client.clientLastName = createProviderRequestDto.clientLastName;
      client.eMail = createProviderRequestDto.eMail.toLowerCase();
      client.phoneNumber = createProviderRequestDto.phoneNumber;
      client = await this.clientsRepository.save(client);
    }
    let quotation: Quotation = new Quotation();
    quotation.client = client;
    quotation.totalAmount = Number(createProviderRequestDto.totalAmount); //TODO: Transform to BigDecimal
    quotation.currency = createProviderRequestDto.currency;
    quotation.quotationItems = [];
    createProviderRequestDto.quotationItems.forEach((itemDto, itemIndex) => {
      const item = new QuotationItem();
      item.id = itemIndex;
      item.name = itemDto.name;
      item.code = itemDto.code;
      item.unitPrice = Number(itemDto.unitPrice); //TODO: Transform to BigDecimal
      item.quotation = quotation;
      item.itemCount = itemDto.itemCount;
      quotation.quotationItems.push(item);
    });

    quotation = await this.quotationRepository.save(quotation);
    await this.quotationItemsRepository.save(quotation.quotationItems);
    return {
      id: quotation.id,
      itemCount: quotation.quotationItems.length,
    };
  }

  async findAllQuotations(pageOptionsDto: PageOptionsDto) {
    this.logger.debug('find all users', { service: QuotationsRepository.name });
    return super.findAll(pageOptionsDto, this.quotationRepository, undefined, {}, undefined, QuotationResponseDto);
  }
}

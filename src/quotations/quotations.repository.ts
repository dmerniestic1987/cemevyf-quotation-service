import { Logger } from '@nestjs/common';
import { Quotation } from './quotation.entity';
import { BaseRepository } from '../commons/repository/base-repository';
import {DataSource, Repository} from 'typeorm';
import { CreateQuotationRequestDto } from './dto/create-quotation-request.dto';
import { QuotationResponseDto } from './dto/quotation-response.dto';
import {InjectDataSource, InjectRepository} from '@nestjs/typeorm';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import {Client} from "../clients/client.entity";
import {QuotationItem} from "./quotation-item.entity";
import {createQuotationInternalError} from "../commons/errors/exceptions";

export class QuotationsRepository extends BaseRepository<Quotation, CreateQuotationRequestDto> {
  private readonly logger = new Logger(QuotationsRepository.name);
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
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
    let quotation: Quotation = new Quotation();
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
      item.quotationId = quotation.id;
      item.itemCount = itemDto.itemCount;
      quotation.quotationItems.push(item);
    });
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (!client) {
        client = new Client();
        client.clientId = createProviderRequestDto.clientId;
        client.clientIdType = createProviderRequestDto.clientIdType;
        client.clientFirstName = createProviderRequestDto.clientFirstName;
        client.clientLastName = createProviderRequestDto.clientLastName;
        client.eMail = createProviderRequestDto.eMail.toLowerCase();
        client.phoneNumber = createProviderRequestDto.phoneNumber;
        client = await queryRunner.manager.save(client);
      }
      quotation.client = client;
      quotation = await queryRunner.manager.save(quotation);
      await queryRunner.manager.save(quotation.quotationItems);
      await queryRunner.commitTransaction();
      return {
        id: quotation.id,
        itemCount: quotation.quotationItems.length,
      };
    }

    catch (err) {
      this.logger.error(JSON.stringify(err));
      await queryRunner.rollbackTransaction();
      throw createQuotationInternalError(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async findAllQuotations(pageOptionsDto: PageOptionsDto) {
    this.logger.debug('find all users', { service: QuotationsRepository.name });
    return super.findAll(pageOptionsDto, this.quotationRepository, undefined, {}, undefined, QuotationResponseDto);
  }
}

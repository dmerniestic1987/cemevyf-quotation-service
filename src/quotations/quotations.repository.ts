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
  ) {
    super();
  }

  async createQuotation(createQuotationRequestDto: CreateQuotationRequestDto, client: Client): Promise<Quotation> {
    this.logger.debug('create quotation', { service: QuotationsRepository.name, createQuotationRequestDto });
    let quotation: Quotation = new Quotation();
    quotation.totalAmount = Number(createQuotationRequestDto.totalAmount); //TODO: Transform to BigDecimal
    quotation.currency = createQuotationRequestDto.currency;
    quotation.quotationItems = [];
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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      quotation.client = client;
      if (!client.quotations) {
        client.quotations = [];
      }
      quotation = await queryRunner.manager.save(quotation);
      await queryRunner.manager.save(quotation.quotationItems);
      client.quotations.push(quotation);
      await queryRunner.manager.save(client);
      await queryRunner.commitTransaction();
      return quotation;
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

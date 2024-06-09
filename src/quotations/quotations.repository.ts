import { Logger } from '@nestjs/common';
import { Quotation } from './quotation.entity';
import { BaseRepository } from '../commons/repository/base-repository';
import {DataSource, Repository} from 'typeorm';
import { CreateQuotationRequestDto } from './dto/create-quotation-request.dto';
import { QuotationResponseDto } from './dto/quotation-response.dto';
import {InjectDataSource, InjectRepository} from '@nestjs/typeorm';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import {Client} from "../clients/client.entity";
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

  async createQuotation(quotation: Quotation, client: Client): Promise<Quotation> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      quotation = await queryRunner.manager.save(quotation);
      await queryRunner.manager.save(quotation.quotationItems);
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

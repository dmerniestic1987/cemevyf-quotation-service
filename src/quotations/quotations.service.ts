import { Injectable, Logger } from '@nestjs/common';
import { QuotationsRepository } from './quotations.repository';
import { CreateQuotationRequestDto } from './dto/create-quotation-request.dto';
import { QuotationResponseDto } from './dto/quotation-response.dto';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import {InjectRepository} from "@nestjs/typeorm";
import {Client} from "../clients/client.entity";
import {Repository} from "typeorm";

@Injectable()
export class QuotationsService {
  private logger = new Logger(QuotationsService.name);
  constructor(
      private readonly quotationRepository: QuotationsRepository,
      @InjectRepository(Client)
      private readonly clientsRepository: Repository<Client>
  ) {}

  async createQuotation(createQuotationRequestDto: CreateQuotationRequestDto): Promise<QuotationResponseDto> {
    let client: Client = await this.clientsRepository.findOne({
      where: {
        eMail: createQuotationRequestDto.eMail.toLowerCase(),
      }
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
    //TODO: Check client
    //TODO: We need to get client information from ClientService
    const quotation = await this.quotationRepository.createQuotation(createQuotationRequestDto, client);
    return {
      id: quotation.id,
      itemCount: quotation.quotationItems.length,
    };
  }

  async findAll(pageOptionsDto: PageOptionsDto): Promise<PageResponseDto<QuotationResponseDto>> {
    return null;
  }
}

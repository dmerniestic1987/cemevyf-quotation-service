import { Injectable, Logger } from '@nestjs/common';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { BaseService } from '../commons/service/base-service';
import { notFoundError, resourceAlreadyExist } from '../commons/errors/exceptions';
import { HealthOrder } from '../health-orders/health-order.entity';
import { CreateClientResponseDto } from './dto/create-client-response.dto';
import { ClientResponseDto } from './dto/client-response.dto';
import { Client } from './client.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { FilterClientDto } from './dto/filter-client.dto';
import { ClientEntityDtoMapper } from './dto/mapper/client-entity-dto-mapper';

@Injectable()
export class ClientService extends BaseService<HealthOrder, ClientResponseDto> {
  private logger = new Logger(ClientService.name);
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
  ) {
    super();
  }

  async create(clientDto: ClientResponseDto): Promise<CreateClientResponseDto> {
    this.logger.debug('Create Client', { service: ClientService.name, clientDto });
    let client: Client = await this.clientsRepository.findOne({
      where: {
        personId: clientDto.personId,
        personIdType: clientDto.personIdType,
      },
    });
    if (client) {
      throw resourceAlreadyExist('Client already exists');
    }

    client = new Client();
    client.personId = clientDto.personId;
    client.personIdType = clientDto.personIdType;
    client.firstName = clientDto.firstName;
    client.lastName = clientDto.lastName;
    client.externalId = clientDto.externalId;
    client.booklyId = clientDto.booklyId;
    client.email = clientDto.email;
    client.phoneNumber = clientDto.phoneNumber;
    client = await this.clientsRepository.save(client);
    return {
      id: client.id,
    };
  }

  async findClients(
    filterDto: FilterClientDto,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageResponseDto<ClientResponseDto>> {
    this.logger.debug('Find Clients', { service: ClientService.name, filterDto, pageOptionsDto });
    const where = {};
    if (filterDto.id) {
      where['id'] = filterDto.id;
    }

    if (filterDto.personId) {
      where['personId'] = filterDto.personId;
    }

    if (filterDto.personIdType) {
      where['personIdType'] = filterDto.personIdType;
    }

    if (filterDto.firstName) {
      where['firstName'] = Like(`%${filterDto.firstName}%`);
    }

    if (filterDto.lastName) {
      where['lastName'] = Like(`%${filterDto.lastName}%`);
    }

    return super.findAndPaginate(
      pageOptionsDto,
      this.clientsRepository,
      where,
      undefined,
      ClientEntityDtoMapper.clientToQuotationResponseDto,
    );
  }

  async findOrder(id: string): Promise<ClientResponseDto> {
    this.logger.debug('Find Order', { service: ClientService.name, id });
    const client = await this.clientsRepository.findOne({
      where: {
        id,
      },
    });
    if (!client) {
      throw notFoundError(`Client ID: ${id} was not found`);
    }
    return ClientEntityDtoMapper.clientToQuotationResponseDto(client);
  }
}

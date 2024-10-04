import { Injectable, Logger } from '@nestjs/common';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { BaseService } from '../commons/service/base-service';
import { featureNotImplementedError, notFoundError, resourceAlreadyExist } from '../commons/errors/exceptions';
import { HealthOrder } from '../health-orders/health-order.entity';
import { CreateClientResponseDto } from './dto/create-client-response.dto';
import { ClientResponseDto } from './dto/client-response.dto';
import { Client } from './client.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilterClientDto } from './dto/filter-client.dto';

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
        clientId: clientDto.clientId,
        clientIdType: clientDto.clientIdType,
      },
    });
    if (client) {
      throw resourceAlreadyExist('Client already exists');
    }

    client = new Client();
    client.clientId = clientDto.clientId;
    client.clientIdType = clientDto.clientIdType;
    client.firstName = clientDto.firstName;
    client.lastName = clientDto.lastName;
    client.externalId = clientDto.externalId;
    client.booklyId = clientDto.booklyId;
    client.email = clientDto.email;
    client = await this.clientsRepository.save(client);
    return {
      id: client.id,
    };
  }

  async findClients(
    filterDto: FilterClientDto,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageResponseDto<ClientResponseDto>> {
    throw featureNotImplementedError();
  }

  async findOrder(id: string): Promise<ClientResponseDto> {
    const client = await this.clientsRepository.findOne({
      where: {
        id,
      },
    });
    if (!client) {
      throw notFoundError(`Client ID: ${id} was not found`);
    }
    return {
      id: client.id,
      clientId: client.clientId,
      clientIdType: client.clientIdType,
      firstName: client.firstName,
      lastName: client.lastName,
      externalId: client.externalId,
      booklyId: client.booklyId,
      email: client.email,
    };
  }
}

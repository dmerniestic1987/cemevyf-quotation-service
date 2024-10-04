import { Injectable, Logger } from '@nestjs/common';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { BaseService } from '../commons/service/base-service';
import { featureNotImplementedError, resourceAlreadyExist } from '../commons/errors/exceptions';
import { HealthOrder } from '../health-orders/health-order.entity';
import { FilterHealthOrderDto } from '../health-orders/dto/filter-health-order.dto';
import { UpdateHealthOrderRequestDto } from '../health-orders/dto/update-health-order-request.dto';
import { HealthOrderResponseDto } from '../health-orders/dto/health-order-response.dto';
import { CreateClientResponseDto } from './dto/create-client-response.dto';
import { ClientResponseDto } from './dto/client-response.dto';
import { Client } from './client.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilterClientDto } from './dto/filter-client.dto';

@Injectable()
export class ClientService
  extends BaseService<HealthOrder, ClientResponseDto>
{
  private logger = new Logger(ClientService.name);
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>
  ) {
    super();
  }

  async create(clientDto: ClientResponseDto): Promise<CreateClientResponseDto> {
    let client: Client = await this.clientsRepository.findOne({
      where: {
        clientId: clientDto.clientId,
        clientIdType: clientDto.clientIdType,
      }
    });
    if (client) {
      throw resourceAlreadyExist('Client already exists');
    }

    client = new Client();
    client.clientId = clientDto.clientId;
    client.clientIdType = clientDto.clientIdType;
    client.clientFirstName = clientDto.clientFirstName;
    client.clientLastName = clientDto.clientLastName;
    client.externalId = clientDto.externalId;
    clientDto.booklyId = clientDto.booklyId;
    client = await this.clientsRepository.save(client);
    return {
      id: client.id,
    }
  }

  async findClients(
    filterDto: FilterClientDto,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageResponseDto<ClientResponseDto>> {
    throw featureNotImplementedError();
  }

  async findOrder(id: number): Promise<ClientResponseDto> {
    throw featureNotImplementedError();
  }
}

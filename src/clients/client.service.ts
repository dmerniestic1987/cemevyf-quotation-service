import { Injectable, Logger } from '@nestjs/common';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { BaseService } from '../commons/service/base-service';
import { featureNotImplementedError } from '../commons/errors/exceptions';
import { HealthOrder } from '../health-orders/health-order.entity';
import { FilterHealthOrderDto } from '../health-orders/dto/filter-health-order.dto';
import { UpdateHealthOrderRequestDto } from '../health-orders/dto/update-health-order-request.dto';
import { CreateHealthOrderRequestDto } from '../health-orders/dto/create-health-order-request.dto';
import { HealthOrderResponseDto } from '../health-orders/dto/health-order-response.dto';
import { CreateClientResponseDto } from './dto/create-client-response.dto';
import { CreateClientRequestDto } from './dto/create-client-request.dto';

@Injectable()
export class ClientService
  extends BaseService<HealthOrder, CreateHealthOrderRequestDto>
{
  private logger = new Logger(ClientService.name);

  async create(orderDto: CreateClientRequestDto): Promise<CreateClientResponseDto> {
    throw featureNotImplementedError();
  }

  async findOrders(
    filterDto: FilterHealthOrderDto,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageResponseDto<HealthOrderResponseDto>> {
    throw featureNotImplementedError();
  }

  async findOrder(id: number): Promise<HealthOrderResponseDto> {
    throw featureNotImplementedError();
  }

  async update(id: number, updateQuotationDto: UpdateHealthOrderRequestDto): Promise<HealthOrderResponseDto> {
    throw featureNotImplementedError();
  }
}

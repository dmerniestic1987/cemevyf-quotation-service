import { CreateHealthOrderRequestDto } from './dto/create-health-order-request.dto';
import { HealthOrderResponseDto } from './dto/health-order-response.dto';
import { FilterHealthOrderDto } from './dto/filter-health-order.dto';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { UpdateHealthOrderRequestDto } from './dto/update-health-order-request.dto';
import { SendHealthOrderEMailRequestDto } from './dto/send-health-order-e-mail-request.dto';
import { HealthOrderEmailSentResponseDto } from './dto/health-order-email-sent-response.dto';

export interface IHealthOrderService {
  createHealthOrder(orderDto: CreateHealthOrderRequestDto): Promise<HealthOrderResponseDto>;

  findHealthOrders(
    filterDto: FilterHealthOrderDto,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageResponseDto<HealthOrderResponseDto>>;

  findHealthOrder(id: number): Promise<HealthOrderResponseDto>;

  updateHealthOrder(id: number, updateQuotationDto: UpdateHealthOrderRequestDto): Promise<HealthOrderResponseDto>;

  sendHealthOrderEMail(
    id: number,
    sendQuotationDto: SendHealthOrderEMailRequestDto,
  ): Promise<HealthOrderEmailSentResponseDto>;
}

import { CreateHealthOrderRequestDto } from './dto/create-health-order-request.dto';
import { HealthOrderResponseDto } from './dto/health-order-response.dto';
import { FilterHealthOrderDto } from './dto/filter-health-order.dto';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { UpdateHealthOrderRequestDto } from './dto/update-health-order-request.dto';
import { SendHealthOrderEMailRequestDto } from './dto/send-health-order-e-mail-request.dto';
import { HealthOrderEmailSentResponseDto } from './dto/health-order-email-sent-response.dto';

export interface IHealthOrderService {
  create(orderDto: CreateHealthOrderRequestDto): Promise<HealthOrderResponseDto>;

  findOrders(
    filterDto: FilterHealthOrderDto,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageResponseDto<HealthOrderResponseDto>>;

  findOrder(id: number): Promise<HealthOrderResponseDto>;

  update(id: number, updateQuotationDto: UpdateHealthOrderRequestDto): Promise<HealthOrderResponseDto>;

  sendHealthOrderToClient(
    id: number,
    sendQuotationDto: SendHealthOrderEMailRequestDto,
  ): Promise<HealthOrderEmailSentResponseDto>;

  /**
   * The health order transitions to an executed state when a professional carries out the procedures associated
   * with the order.
   * @param id
   */
  execute(id: number): Promise<any>;

  /**
   * Attach a file to the health order.
   * @param id
   * @param fileBase64
   */
  attachFile(id: number, fileBase64: string): Promise<any>;

  /**
   * Attach a file to the health order.
   * @param id
   * @param fileBase64
   */
  attachResultFile(id: number, fileBase64: string): Promise<any>;

  /**
   * Send the results via email.
   * @param id
   */
  sendResultFilesEmail(id: number): Promise<any>;
}

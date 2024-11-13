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

  sendHealthOrderQuotationToClient(
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
   * @param file
   * @param additionalNotes
   * @returns id of attached file
   */
  attachHealthOrderPrescription(id: number, file: Express.Multer.File, additionalNotes: string): Promise<string>;

  /**
   * Attach a file to the health order.
   * @param id
   * @param resultFile
   * @param additionalNotes
   * @returns id of attached file
   */
  attachResultFile(id: number, resultFile: Express.Multer.File, additionalNotes: string): Promise<string>;

  /**
   * Send the results via email.
   * @param id
   * @returns id of result file
   */
  sendResultFilesEmail(id: number): Promise<string>;
}

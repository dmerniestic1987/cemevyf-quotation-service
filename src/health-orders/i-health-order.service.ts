import { CreateHealthOrderRequestDto } from './dto/create-health-order-request.dto';
import { HealthOrderResponseDto } from './dto/health-order-response.dto';
import { FilterHealthOrderDto } from './dto/filter-health-order.dto';
import { PageOptionsDto } from '../commons/dto/page-options.dto';
import { PageResponseDto } from '../commons/dto/page-response.dto';
import { UpdateHealthOrderRequestDto } from './dto/update-health-order-request.dto';
import { HealthOrderStatus } from './types/health-order-status';
import { HealthOrderFileResponseDto } from './dto/health-order-file-response.dto';
import { HealthOrderFileDownload } from './types/health-order-file-download';

export interface IHealthOrderService {
  create(orderDto: CreateHealthOrderRequestDto): Promise<HealthOrderResponseDto>;

  findOrders(
    filterDto: FilterHealthOrderDto,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageResponseDto<HealthOrderResponseDto>>;

  findOrder(id: number): Promise<HealthOrderResponseDto>;

  update(id: number, updateQuotationDto: UpdateHealthOrderRequestDto): Promise<HealthOrderResponseDto>;

  /**
   * The health order transitions to an executed state when a professional carries out the procedures associated
   * with the order.
   * @param id
   * @param newStatus
   */
  updateHealthOrderStatus(id: number, newStatus: HealthOrderStatus): Promise<any>;

  /**
   * Assigns the health order to another client. Only health orders in quoted status allow it.
   * @param id health order id
   * @param clientId id of the new client
   */
  updateHealthOrderClient(id: number, clientId: string): Promise<HealthOrderResponseDto>;

  /**
   * Moves several health orders to the same status. Either all of them are updated or none is.
   * @param ids health order ids
   * @param newStatus status every order must move to
   * @returns the updated orders in the same order as ids
   */
  bulkUpdateHealthOrderStatus(ids: number[], newStatus: HealthOrderStatus): Promise<HealthOrderResponseDto[]>;

  /**
   * Attach a file to the health order. Allowed in any status except results_done.
   * @param id
   * @param file
   * @param additionalNotes
   * @returns id of attached file
   */
  attachHealthOrderPrescription(id: number, file: Express.Multer.File, additionalNotes: string): Promise<string>;

  /**
   * Attach a result file to the health order. Allowed in any status except results_done.
   * @param id
   * @param resultFile
   * @param additionalNotes
   * @returns id of attached file
   */
  attachResultFile(id: number, resultFile: Express.Multer.File, additionalNotes: string): Promise<string>;

  /**
   * Lists the metadata of the files attached to the health order.
   */
  findOrderFiles(id: number): Promise<HealthOrderFileResponseDto[]>;

  /**
   * Deletes an attached file: its record in the database and the file in the storage. Only health orders in
   * quoted or pending_results status allow it.
   * @param id health order id
   * @param fileId id of the attached file
   */
  deleteOrderFile(id: number, fileId: string): Promise<void>;

  /**
   * Opens an attached file for download.
   * @param id health order id
   * @param fileId id of the attached file
   */
  downloadOrderFile(id: number, fileId: string): Promise<HealthOrderFileDownload>;
}

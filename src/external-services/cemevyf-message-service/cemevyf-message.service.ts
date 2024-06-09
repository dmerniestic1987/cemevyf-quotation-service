import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map } from 'rxjs';
const { serviceConfig } = require('config');

@Injectable()
export class CemevyfMessageService {
  private readonly logger = new Logger(CemevyfMessageService.name);
  private messageServiceUrl: string;
  constructor(private readonly httpService: HttpService) {
    this.messageServiceUrl = serviceConfig.messageServiceUrl;
  }

  /**
   * Sends a signed transaction to abstraction-layer
   * @param transactionId from abstraction-layer.transactions
   * @param signedTransaction signed transaction
   */
  async sendMail(message: any): Promise<any> {
    this.logger.debug({ name: CemevyfMessageService.name, message});
    try {
      return lastValueFrom<any>(
        this.httpService
          .post(`${this.messageServiceUrl}/transactions`, message)
          .pipe(map(result => result.data)),
      );
    } catch (error) {
      this.logger.error('Error sending signed transaction to cemevyf-message-service', error);
      throw new InternalServerErrorException(error, 'Error send e-mail with message-service');
    }
  }
}

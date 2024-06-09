import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map } from 'rxjs';
import { SignedTransactionData } from '../../commons/types/signed-transaction-data';
import { SignAndExecuteTransactionResponseDto } from '../../users/dto/sign-and-execute-transaction-response.dto';
const { serviceConfig } = require('config');

@Injectable()
export class CemevyfMessageService {
  private readonly logger = new Logger(CemevyfMessageServiceService.name);
  private abstractionLayerUrl: string;
  constructor(private readonly httpService: HttpService) {
    this.abstractionLayerUrl = serviceConfig.abstractionLayerUrl;
  }

  /**
   * Sends a signed transaction to abstraction-layer
   * @param transactionId from abstraction-layer.transactions
   * @param signedTransaction signed transaction
   */
  async executeSignedTransaction(
    transactionId: string,
    signedTransaction: SignedTransactionData,
  ): Promise<SignAndExecuteTransactionResponseDto> {
    this.logger.debug(
      `Sending signed transaction`,
      `${this.abstractionLayerUrl}/transactions/${transactionId}`,
      JSON.stringify(signedTransaction),
    );
    try {
      return lastValueFrom<SignAndExecuteTransactionResponseDto>(
        this.httpService
          .post(`${this.abstractionLayerUrl}/transactions/${transactionId}`, signedTransaction)
          .pipe(map(result => result.data)),
      );
    } catch (error) {
      this.logger.error('Error sending signed transaction to abstraction-layer', error);
      throw new InternalServerErrorException(error, 'Error sending signed transaction with abstraction-layer');
    }
  }
}

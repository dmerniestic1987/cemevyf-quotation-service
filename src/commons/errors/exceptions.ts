import { HttpException, HttpStatus } from '@nestjs/common';

export const createQuotationInternalError = (msg = 'Error creation quotation') => {
  return new HttpException({ message: msg, code: 'INVALID_TOKEN_ID' }, HttpStatus.INTERNAL_SERVER_ERROR);
};

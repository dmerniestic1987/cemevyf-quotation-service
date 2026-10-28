import { HttpException, HttpStatus } from '@nestjs/common';

export const createQuotationInternalError = (msg = 'Error creation quotation') => {
  return new HttpException({ message: msg, code: 'HEALTH_ORDER_INTERNAL_ERROR' }, HttpStatus.INTERNAL_SERVER_ERROR);
};

export const notFoundError = (msg = 'Entity not found', details?: Record<string, unknown>) => {
  return new HttpException({ message: msg, code: 'NOT_FOUND_ERROR', details }, HttpStatus.NOT_FOUND);
};

export const healthOrderIncorrectStatusError = (
  msg = 'Health order not in correct status',
  details?: Record<string, unknown>,
) => {
  return new HttpException({ message: msg, code: 'INCORRECT_STATUS_ERROR', details }, HttpStatus.BAD_REQUEST);
};

export const resourceAlreadyExist = (msg = 'Resource already exists') => {
  return new HttpException({ message: msg, code: 'RESOURCE_ALREADY_EXISTS' }, HttpStatus.CONFLICT);
};

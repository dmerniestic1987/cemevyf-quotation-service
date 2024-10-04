import { HttpException, HttpStatus } from '@nestjs/common';

export const createQuotationInternalError = (msg = 'Error creation quotation') => {
  return new HttpException({ message: msg, code: 'INVALID_TOKEN_ID_ERROR' }, HttpStatus.INTERNAL_SERVER_ERROR);
};

export const featureNotImplementedError = (msg = 'Feature Not Implemented') => {
  return new HttpException({ message: msg, code: 'FEATURE_NOT_IMPLEMENTED_ERROR' }, HttpStatus.NOT_IMPLEMENTED);
};

export const notFoundError = (msg = 'Entity not found') => {
  return new HttpException({ message: msg, code: 'NOT_FOUND_ERROR' }, HttpStatus.NOT_FOUND);
};

export const resourceAlreadyExist = (msg = 'Resource already exists') => {
  return new HttpException({ message: msg, code: 'RESOURCE_ALREADY_EXISTS' }, HttpStatus.CONFLICT);
};

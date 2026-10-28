import { HttpStatus } from '@nestjs/common';
import {
  createQuotationInternalError,
  healthOrderIncorrectStatusError,
  notFoundError,
  resourceAlreadyExist,
} from './exceptions';

describe('exceptions', () => {
  it('builds an internal error with a default message', () => {
    const error = createQuotationInternalError();

    expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(error.getResponse()).toEqual({ message: 'Error creation quotation', code: 'HEALTH_ORDER_INTERNAL_ERROR' });
  });

  it('builds an internal error with a custom message', () => {
    expect(createQuotationInternalError('db down').getResponse()).toMatchObject({ message: 'db down' });
  });

  describe('notFoundError', () => {
    it('uses a default message and has no details', () => {
      const error = notFoundError();

      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(error.getResponse()).toEqual({ message: 'Entity not found', code: 'NOT_FOUND_ERROR' });
    });

    it('accepts a custom message with details', () => {
      expect(notFoundError('missing', { missingIds: [1, 2] }).getResponse()).toEqual({
        message: 'missing',
        code: 'NOT_FOUND_ERROR',
        details: { missingIds: [1, 2] },
      });
    });
  });

  describe('healthOrderIncorrectStatusError', () => {
    it('uses a default message and has no details', () => {
      const error = healthOrderIncorrectStatusError();

      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.getResponse()).toEqual({
        message: 'Health order not in correct status',
        code: 'INCORRECT_STATUS_ERROR',
      });
    });

    it('accepts a custom message with details', () => {
      expect(healthOrderIncorrectStatusError('wrong', { invalidOrders: [{ id: 1 }] }).getResponse()).toEqual({
        message: 'wrong',
        code: 'INCORRECT_STATUS_ERROR',
        details: { invalidOrders: [{ id: 1 }] },
      });
    });
  });

  describe('resourceAlreadyExist', () => {
    it('uses a default message', () => {
      const error = resourceAlreadyExist();

      expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(error.getResponse()).toEqual({ message: 'Resource already exists', code: 'RESOURCE_ALREADY_EXISTS' });
    });

    it('accepts a custom message', () => {
      expect(resourceAlreadyExist('duplicated').getResponse()).toMatchObject({ message: 'duplicated' });
    });
  });
});

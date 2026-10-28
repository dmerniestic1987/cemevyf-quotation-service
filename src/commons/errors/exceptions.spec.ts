import { HttpStatus } from '@nestjs/common';
import {
  badRequestError,
  createQuotationInternalError,
  forbiddenError,
  healthOrderIncorrectStatusError,
  notFoundError,
  resourceAlreadyExist,
  unauthorizedError,
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

  it('builds an unauthorized error', () => {
    expect(unauthorizedError().getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(unauthorizedError().getResponse()).toEqual({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
    expect(unauthorizedError('expired').getResponse()).toMatchObject({ message: 'expired' });
  });

  it('builds a forbidden error', () => {
    expect(forbiddenError().getStatus()).toBe(HttpStatus.FORBIDDEN);
    expect(forbiddenError().getResponse()).toEqual({ message: 'Forbidden', code: 'FORBIDDEN' });
    expect(forbiddenError('no').getResponse()).toMatchObject({ message: 'no' });
  });

  it('builds a bad request error with a default and a custom code', () => {
    expect(badRequestError().getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(badRequestError().getResponse()).toEqual({ message: 'Bad request', code: 'BAD_REQUEST' });
    expect(badRequestError('bad', 'CUSTOM').getResponse()).toEqual({ message: 'bad', code: 'CUSTOM' });
  });
});

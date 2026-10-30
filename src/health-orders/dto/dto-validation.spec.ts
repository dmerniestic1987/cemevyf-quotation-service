import { ValidationPipe } from '@nestjs/common';
import { CreateHealthOrderRequestDto } from './create-health-order-request.dto';
import { UpdateHealthOrderRequestDto } from './update-health-order-request.dto';
import { FilterHealthOrderDto } from './filter-health-order.dto';
import {
  BulkUpdateHealthOrderStatusRequestDto,
  MAX_BULK_STATUS_UPDATE_IDS,
} from './bulk-update-health-order-status-request.dto';
import { AdditionalDataDto } from './additional-data.dto';
import { UpdateHealthOrderStatusRequestDto } from './update-health-order-status-request.dto';
import { UpdateHealthOrderClientRequestDto } from './update-health-order-client-request.dto';
import { ClientRequestDto } from '../../clients/dto/client-request.dto';
import { FilterClientDto } from '../../clients/dto/filter-client.dto';

// Same options as the global pipe configured in main.ts
const validationPipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });

const validate = (metatype: any, value: any, type: 'body' | 'query' = 'body') =>
  validationPipe.transform(value, { type, metatype });

const getErrors = async (metatype: any, value: any, type: 'body' | 'query' = 'body'): Promise<string[]> => {
  try {
    await validate(metatype, value, type);
    return [];
  } catch (err) {
    return err.getResponse().message;
  }
};

const CLIENT_ID = '14e7b437-3c5c-44a6-8d99-a0fab3ef6c40';
const validItem = { code: 'T4L', name: 'T4 Libre', unitPrice: '37500.50', itemCount: 2 };

describe('DTO validation', () => {
  describe('CreateHealthOrderRequestDto', () => {
    it('accepts a valid request', async () => {
      const dto = await validate(CreateHealthOrderRequestDto, {
        clientId: CLIENT_ID,
        currency: 'ARS',
        quotationItems: [validItem, { name: 'Glucose', unitPrice: '100', itemCount: 1 }],
      });
      expect(dto).toBeInstanceOf(CreateHealthOrderRequestDto);
    });

    it('rejects a non UUID client ID', async () => {
      expect(
        await getErrors(CreateHealthOrderRequestDto, { clientId: 'a@b.com', quotationItems: [validItem] }),
      ).toEqual(['clientId must be a UUID']);
    });

    it('rejects an empty item list', async () => {
      expect(await getErrors(CreateHealthOrderRequestDto, { clientId: CLIENT_ID, quotationItems: [] })).toEqual([
        'quotationItems must contain at least 1 elements',
      ]);
    });

    it('rejects totalAmount because it is computed by the server', async () => {
      expect(
        await getErrors(CreateHealthOrderRequestDto, {
          clientId: CLIENT_ID,
          totalAmount: '1',
          quotationItems: [validItem],
        }),
      ).toEqual(['property totalAmount should not exist']);
    });

    it('rejects an invalid currency', async () => {
      expect(
        await getErrors(CreateHealthOrderRequestDto, {
          clientId: CLIENT_ID,
          currency: 'EUR',
          quotationItems: [validItem],
        }),
      ).toHaveLength(1);
    });

    it.each(['-5', '1.234', 'abc', '12345678901', '1,5'])('rejects an invalid unit price %p', async unitPrice => {
      const errors = await getErrors(CreateHealthOrderRequestDto, {
        clientId: CLIENT_ID,
        quotationItems: [{ ...validItem, unitPrice }],
      });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('quotationItems.0.unitPrice');
    });

    it('rejects a numeric unit price', async () => {
      const errors = await getErrors(CreateHealthOrderRequestDto, {
        clientId: CLIENT_ID,
        quotationItems: [{ ...validItem, unitPrice: 10 }],
      });
      expect(errors.some(error => error.includes('unitPrice must be a string'))).toBe(true);
    });

    it.each([0, 101, 1.5])('rejects an invalid item count %p', async itemCount => {
      const errors = await getErrors(CreateHealthOrderRequestDto, {
        clientId: CLIENT_ID,
        quotationItems: [{ ...validItem, itemCount }],
      });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects an item without name and with unknown properties', async () => {
      const errors = await getErrors(CreateHealthOrderRequestDto, {
        clientId: CLIENT_ID,
        quotationItems: [{ unitPrice: '10', itemCount: 1, foo: 'bar' }],
      });
      expect(errors).toEqual(
        expect.arrayContaining([
          'quotationItems.0.property foo should not exist',
          'quotationItems.0.name should not be empty',
        ]),
      );
    });
  });

  describe('UpdateHealthOrderRequestDto', () => {
    it('accepts an empty body', async () => {
      expect(await getErrors(UpdateHealthOrderRequestDto, {})).toEqual([]);
    });

    it('accepts only currency', async () => {
      expect(await getErrors(UpdateHealthOrderRequestDto, { currency: 'USD' })).toEqual([]);
    });

    it('rejects an empty item list', async () => {
      expect(await getErrors(UpdateHealthOrderRequestDto, { orderItems: [] })).toEqual([
        'orderItems must contain at least 1 elements',
      ]);
    });

    it('validates nested items', async () => {
      expect(await getErrors(UpdateHealthOrderRequestDto, { orderItems: [{ ...validItem, itemCount: 0 }] })).toEqual([
        'orderItems.0.itemCount must not be less than 1',
      ]);
    });
  });

  describe('FilterHealthOrderDto', () => {
    it('accepts an empty query and applies pagination defaults', async () => {
      const dto = await validate(FilterHealthOrderDto, {}, 'query');
      expect(dto.page).toBe(1);
      expect(dto.take).toBe(10);
    });

    it('transforms query strings into numbers', async () => {
      const dto = await validate(FilterHealthOrderDto, { id: '3', page: '2', take: '5' }, 'query');
      expect(dto).toMatchObject({ id: 3, page: 2, take: 5 });
    });

    it.each(['quoted', 'executed', 'pending_results', 'results_done'])('accepts the %p status filter', async status => {
      const dto = await validate(FilterHealthOrderDto, { status }, 'query');

      expect(dto.status).toBe(status);
    });

    it('accepts the client ID filter', async () => {
      const dto = await validate(FilterHealthOrderDto, { clientId: CLIENT_ID }, 'query');

      expect(dto.clientId).toBe(CLIENT_ID);
    });

    it('rejects a client ID that is not a UUID', async () => {
      const errors = await getErrors(FilterHealthOrderDto, { clientId: '123' }, 'query');

      expect(errors).toEqual(['clientId must be a UUID']);
    });

    it('rejects an unknown status filter', async () => {
      const errors = await getErrors(FilterHealthOrderDto, { status: 'done' }, 'query');

      expect(errors).toEqual([expect.stringContaining('status must be one of')]);
    });

    it('rejects invalid values and unknown parameters', async () => {
      const errors = await getErrors(
        FilterHealthOrderDto,
        { id: 'abc', dateFrom: 'yesterday', take: '51', foo: '1' },
        'query',
      );
      expect(errors).toEqual(
        expect.arrayContaining([
          'property foo should not exist',
          'id must be an integer number',
          'dateFrom must be a valid ISO 8601 date string',
          'take must not be greater than 50',
        ]),
      );
    });
  });

  describe('BulkUpdateHealthOrderStatusRequestDto', () => {
    it('accepts a list of IDs and a status', async () => {
      const dto = await validate(BulkUpdateHealthOrderStatusRequestDto, { ids: [1, 2, 3], status: 'pending_results' });

      expect(dto).toBeInstanceOf(BulkUpdateHealthOrderStatusRequestDto);
      expect(dto).toMatchObject({ ids: [1, 2, 3], status: 'pending_results' });
    });

    it('accepts exactly the maximum amount of IDs', async () => {
      const ids = Array.from({ length: MAX_BULK_STATUS_UPDATE_IDS }, (_, index) => index + 1);

      expect(await getErrors(BulkUpdateHealthOrderStatusRequestDto, { ids, status: 'executed' })).toEqual([]);
    });

    it('rejects more IDs than the maximum', async () => {
      const ids = Array.from({ length: MAX_BULK_STATUS_UPDATE_IDS + 1 }, (_, index) => index + 1);

      expect(await getErrors(BulkUpdateHealthOrderStatusRequestDto, { ids, status: 'executed' })).toEqual([
        `ids must contain no more than ${MAX_BULK_STATUS_UPDATE_IDS} elements`,
      ]);
    });

    it('rejects an empty list of IDs', async () => {
      expect(await getErrors(BulkUpdateHealthOrderStatusRequestDto, { ids: [], status: 'executed' })).toEqual([
        'ids must contain at least 1 elements',
      ]);
    });

    it('rejects a missing list of IDs', async () => {
      const errors = await getErrors(BulkUpdateHealthOrderStatusRequestDto, { status: 'executed' });

      expect(errors).toEqual(expect.arrayContaining(['ids must be an array']));
    });

    it('rejects duplicated IDs', async () => {
      expect(await getErrors(BulkUpdateHealthOrderStatusRequestDto, { ids: [1, 2, 1], status: 'executed' })).toEqual([
        "All ids's elements must be unique",
      ]);
    });

    it.each([[[0]], [[-3]], [[1.5]], [['1']], [[null]]])('rejects the invalid IDs %p', async ids => {
      const errors = await getErrors(BulkUpdateHealthOrderStatusRequestDto, { ids, status: 'executed' });

      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects an unknown status and unknown properties', async () => {
      const errors = await getErrors(BulkUpdateHealthOrderStatusRequestDto, { ids: [1], status: 'done', foo: 'bar' });

      expect(errors).toEqual(
        expect.arrayContaining(['property foo should not exist', expect.stringContaining('status must be one of')]),
      );
    });
  });

  describe('UpdateHealthOrderStatusRequestDto', () => {
    it('rejects an unknown status', async () => {
      expect(await getErrors(UpdateHealthOrderStatusRequestDto, { status: 'done' })).toHaveLength(1);
    });
  });

  describe('UpdateHealthOrderClientRequestDto', () => {
    it('accepts a client ID', async () => {
      const dto = await validate(UpdateHealthOrderClientRequestDto, { clientId: CLIENT_ID });
      expect(dto).toEqual({ clientId: CLIENT_ID });
    });

    it('rejects a client ID that is not a UUID', async () => {
      expect(await getErrors(UpdateHealthOrderClientRequestDto, { clientId: '123' })).toEqual([
        'clientId must be a UUID',
      ]);
    });

    it('rejects a missing client ID', async () => {
      expect(await getErrors(UpdateHealthOrderClientRequestDto, {})).toEqual(['clientId must be a UUID']);
    });

    it('rejects unknown properties', async () => {
      expect(await getErrors(UpdateHealthOrderClientRequestDto, { clientId: CLIENT_ID, status: 'quoted' })).toEqual([
        'property status should not exist',
      ]);
    });
  });

  describe('AdditionalDataDto', () => {
    it('keeps additional notes', async () => {
      const dto = await validate(AdditionalDataDto, { additionalNotes: 'Pending glucose' });
      expect(dto.additionalNotes).toBe('Pending glucose');
    });

    it('rejects notes that are too long', async () => {
      expect(await getErrors(AdditionalDataDto, { additionalNotes: 'x'.repeat(2001) })).toHaveLength(1);
    });
  });

  describe('ClientRequestDto', () => {
    it('accepts only the required fields', async () => {
      expect(await getErrors(ClientRequestDto, { firstName: 'Diego', lastName: 'Rossi' })).toEqual([]);
    });

    it('accepts all fields', async () => {
      expect(
        await getErrors(ClientRequestDto, {
          firstName: 'Diego',
          lastName: 'Rossi',
          personIdType: 'dni',
          personId: '32847809',
          externalId: 'A1',
          booklyId: 'B1',
          email: 'example@hola.com',
          phoneNumber: '1155667788',
        }),
      ).toEqual([]);
    });

    it('rejects empty names, invalid e-mail and non string phone', async () => {
      const errors = await getErrors(ClientRequestDto, {
        firstName: '',
        lastName: 'x'.repeat(101),
        email: 'nope',
        phoneNumber: 1155667788,
      });
      expect(errors).toEqual(
        expect.arrayContaining([
          'firstName should not be empty',
          'lastName must be shorter than or equal to 100 characters',
          'email must be an email',
          'phoneNumber must be a string',
        ]),
      );
    });
  });

  describe('FilterClientDto', () => {
    it('accepts filters together with pagination', async () => {
      expect(await getErrors(FilterClientDto, { firstName: 'Diego', page: '1', take: '10' }, 'query')).toEqual([]);
    });

    it('rejects an invalid ID', async () => {
      expect(await getErrors(FilterClientDto, { id: '1' }, 'query')).toEqual(['id must be a UUID']);
    });
  });
});

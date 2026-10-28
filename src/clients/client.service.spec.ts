import { HttpStatus } from '@nestjs/common';
import { ClientService } from './client.service';
import { Client } from './client.entity';
import { IdTypeEnum } from '../commons/types/id-type.enum';

const CLIENT_ID = '14e7b437-3c5c-44a6-8d99-a0fab3ef6c40';

describe('ClientService', () => {
  let clientsRepository: { findOne: jest.Mock; save: jest.Mock; findAndCount: jest.Mock };
  let service: ClientService;

  beforeEach(() => {
    clientsRepository = {
      findOne: jest.fn(),
      save: jest.fn(async client => Object.assign(client, { id: CLIENT_ID })),
      findAndCount: jest.fn(async () => [[], 0]),
    };
    service = new ClientService(clientsRepository as any);
  });

  describe('create', () => {
    const clientDto = {
      firstName: 'Diego',
      lastName: 'Rossi',
      personIdType: IdTypeEnum.DNI,
      personId: '32847809',
      email: 'a@b.com',
      phoneNumber: '1155667788',
      externalId: 'A1',
      booklyId: 'B1',
    };

    it('creates a new client', async () => {
      clientsRepository.findOne.mockResolvedValue(null);

      await expect(service.create(clientDto)).resolves.toEqual({ id: CLIENT_ID });
      expect(clientsRepository.findOne).toHaveBeenCalledWith({
        where: { personId: '32847809', personIdType: IdTypeEnum.DNI },
      });
      expect(clientsRepository.save).toHaveBeenCalledWith(expect.objectContaining(clientDto));
    });

    it('does not look for duplicates when the client has no document', async () => {
      const clientWithoutDocument = { ...clientDto, personId: undefined, personIdType: undefined };

      await expect(service.create(clientWithoutDocument)).resolves.toEqual({ id: CLIENT_ID });
      expect(clientsRepository.findOne).not.toHaveBeenCalled();
      expect(clientsRepository.save).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Diego' }));
    });

    it.each([
      ['the document type', { personId: undefined }],
      ['the document number', { personIdType: undefined }],
    ])('does not look for duplicates when only %s is provided', async (_name, missingField) => {
      await service.create({ ...clientDto, ...missingField });

      expect(clientsRepository.findOne).not.toHaveBeenCalled();
    });

    it('throws conflict when the client already exists', async () => {
      clientsRepository.findOne.mockResolvedValue(new Client());

      await expect(service.create(clientDto)).rejects.toMatchObject({ status: HttpStatus.CONFLICT });
      expect(clientsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findClients', () => {
    const pageOptions = { page: 1, take: 10 };

    it('builds the filter with every field', async () => {
      clientsRepository.findAndCount.mockResolvedValue([
        [Object.assign(new Client(), { id: CLIENT_ID, firstName: 'Diego' })],
        1,
      ]);

      const result = await service.findClients(
        { id: CLIENT_ID, personId: '1', personIdType: IdTypeEnum.DNI, firstName: 'Die', lastName: 'Ros' },
        pageOptions,
      );

      const { where } = clientsRepository.findAndCount.mock.calls[0][0];
      expect(where).toMatchObject({ id: CLIENT_ID, personId: '1', personIdType: IdTypeEnum.DNI });
      expect(where.firstName.value).toBe('%Die%');
      expect(where.lastName.value).toBe('%Ros%');
      expect(result.data).toHaveLength(1);
      expect(result.meta.itemCount).toBe(1);
    });

    it('uses an empty filter when nothing is provided', async () => {
      await service.findClients({}, pageOptions);

      expect(clientsRepository.findAndCount.mock.calls[0][0].where).toEqual({});
    });
  });

  describe('findOrder', () => {
    it('returns the client', async () => {
      clientsRepository.findOne.mockResolvedValue(Object.assign(new Client(), { id: CLIENT_ID }));

      await expect(service.findOrder(CLIENT_ID)).resolves.toMatchObject({ id: CLIENT_ID });
    });

    it('throws not found when the client does not exist', async () => {
      clientsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOrder(CLIENT_ID)).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
    });
  });
});

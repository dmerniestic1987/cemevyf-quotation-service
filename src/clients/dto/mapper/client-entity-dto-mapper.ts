import { Client } from '../../client.entity';
import { ClientResponseDto } from '../client-response.dto';

export class ClientEntityDtoMapper {
  public static clientToQuotationResponseDto(client: Client): ClientResponseDto {
    return {
      id: client.id,
      personId: client.personId,
      personIdType: client.personIdType,
      firstName: client.firstName,
      lastName: client.lastName,
      externalId: client.externalId,
      booklyId: client.booklyId,
      email: client.email,
    };
  }
}

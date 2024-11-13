import { HealthOrder } from './health-order.entity';
import { CemevyfMailMessage } from '../external-services/cemevyf-message-service/cemevyf-message.service';

export class HealthOrderMailUtils {

  public static toCemevyfMailMessage(
    eMail: string,
    quotation: HealthOrder,
    subject = 'CEMEVYF - Cotización de estudios médicos',
  ): CemevyfMailMessage {
    const items =
      quotation.healthOrderItems?.map(quotationItem => {
        return {
          id: quotationItem.id,
          code: quotationItem.code,
          name: quotationItem.name,
          itemCount: quotationItem.itemCount,
        };
      }) || [];
    return {
      to: eMail || quotation.client.email,
      subject,
      context: {
        clientFirstName: quotation.client.firstName,
        clientLastName: quotation.client.lastName,
        createdAt: quotation.createdAt.toDateString(),
        quotationId: quotation.id,
        totalAmount: quotation.totalAmount,
        items,
      },
    };
  }
}

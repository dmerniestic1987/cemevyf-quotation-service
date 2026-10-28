import { HealthOrderMailUtils } from './health-order-mail-utils';
import { HealthOrder } from './health-order.entity';
import { HealthOrderItem } from './health-order-item.entity';
import { Client } from '../clients/client.entity';

const buildHealthOrder = (healthOrderItems?: HealthOrderItem[]): HealthOrder =>
  Object.assign(new HealthOrder(), {
    id: 7,
    totalAmount: 401.5,
    createdAt: new Date('2026-10-24T12:00:00.000Z'),
    client: Object.assign(new Client(), { firstName: 'Diego', lastName: 'Rossi', email: 'client@b.com' }),
    healthOrderItems,
  });

describe('HealthOrderMailUtils', () => {
  const item = Object.assign(new HealthOrderItem(), { id: 0, code: 'A', name: 'a', itemCount: 2, unitPrice: 10 });

  it('builds the message for the given e-mail with the order data', () => {
    const message = HealthOrderMailUtils.toCemevyfMailMessage('other@b.com', buildHealthOrder([item]));

    expect(message.to).toBe('other@b.com');
    expect(message.subject).toBe('CEMEVYF - Cotización de estudios médicos');
    expect(message.context).toEqual({
      clientFirstName: 'Diego',
      clientLastName: 'Rossi',
      createdAt: 'Sat Oct 24 2026',
      quotationId: 7,
      totalAmount: 401.5,
      items: [{ id: 0, code: 'A', name: 'a', itemCount: 2 }],
    });
  });

  it('falls back to the client e-mail', () => {
    expect(HealthOrderMailUtils.toCemevyfMailMessage(undefined, buildHealthOrder([item])).to).toBe('client@b.com');
  });

  it('builds an empty item list when the order has no items loaded', () => {
    expect(HealthOrderMailUtils.toCemevyfMailMessage('a@b.com', buildHealthOrder()).context.items).toEqual([]);
  });

  it('accepts a custom subject', () => {
    expect(HealthOrderMailUtils.toCemevyfMailMessage('a@b.com', buildHealthOrder(), 'Custom').subject).toBe('Custom');
  });
});

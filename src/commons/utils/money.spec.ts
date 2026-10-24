import { computeTotal, fromCents, toCents } from './money';

describe('money utils', () => {
  describe('toCents', () => {
    it.each([
      ['0', 0],
      ['0.1', 10],
      ['0.10', 10],
      ['37500.50', 3750050],
      ['37500.5', 3750050],
      ['100', 10000],
      [' 12.34 ', 1234],
      [1.5, 150],
    ])('converts %p into %p cents', (amount, expected) => {
      expect(toCents(amount)).toBe(expected);
    });

    it.each(['-5', 'abc', '1.234', '', '1,50'])('throws on invalid amount %p', amount => {
      expect(() => toCents(amount)).toThrow(`Invalid amount: ${amount}`);
    });
  });

  describe('fromCents', () => {
    it.each([
      [0, '0.00'],
      [5, '0.05'],
      [10, '0.10'],
      [3750050, '37500.50'],
    ])('converts %p cents into %p', (cents, expected) => {
      expect(fromCents(cents)).toBe(expected);
    });
  });

  describe('computeTotal', () => {
    it('sums unit price times count without floating point errors', () => {
      expect(
        computeTotal([
          { unitPrice: '0.10', itemCount: 3 },
          { unitPrice: '37500.50', itemCount: 2 },
        ]),
      ).toBe('75001.30');
    });

    it('returns zero for an empty list', () => {
      expect(computeTotal([])).toBe('0.00');
    });
  });
});

const DECIMAL_AMOUNT_REGEX = /^(\d+)(?:\.(\d{1,2}))?$/;

/**
 * Converts a non-negative decimal amount with up to 2 decimal places (e.g. "37500.5") into integer cents,
 * avoiding floating point rounding errors.
 */
export const toCents = (amount: string | number): number => {
  const match = DECIMAL_AMOUNT_REGEX.exec(String(amount).trim());
  if (!match) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  const [, integerPart, decimalPart = ''] = match;
  return Number(integerPart) * 100 + Number(decimalPart.padEnd(2, '0'));
};

/**
 * Converts integer cents into a decimal string with exactly 2 decimal places (e.g. 3750050 -> "37500.50").
 */
export const fromCents = (cents: number): string => {
  const integerPart = Math.floor(cents / 100);
  const decimalPart = String(cents % 100).padStart(2, '0');
  return `${integerPart}.${decimalPart}`;
};

/**
 * Computes the total of a list of line items as a decimal string with 2 decimal places.
 */
export const computeTotal = (items: { unitPrice: string | number; itemCount: number }[]): string => {
  const totalCents = items.reduce((total, item) => total + toCents(item.unitPrice) * item.itemCount, 0);
  return fromCents(totalCents);
};

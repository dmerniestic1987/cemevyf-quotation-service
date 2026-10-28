import { getPreviousStatus, HealthOrderStatus, nextStatusMap } from './health-order-status';

describe('health order status', () => {
  describe('getPreviousStatus', () => {
    it.each([
      [HealthOrderStatus.EXECUTED, HealthOrderStatus.QUOTED],
      [HealthOrderStatus.PENDING_RESULTS, HealthOrderStatus.EXECUTED],
      [HealthOrderStatus.RESULTS_DONE, HealthOrderStatus.PENDING_RESULTS],
    ])('the only status leading to %p is %p', (status, expectedPrevious) => {
      expect(getPreviousStatus(status)).toBe(expectedPrevious);
      expect(nextStatusMap.get(expectedPrevious)).toBe(status);
    });

    it('returns undefined for the initial status, which no transition leads to', () => {
      expect(getPreviousStatus(HealthOrderStatus.QUOTED)).toBeUndefined();
    });
  });
});

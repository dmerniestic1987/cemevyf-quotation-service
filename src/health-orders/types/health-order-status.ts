export enum HealthOrderStatus {
  QUOTED = 'quoted',
  EXECUTED = 'executed',
  PENDING_RESULTS = 'pending_results',
  RESULTS_DONE = 'results_done',
}

export const nextStatusMap = new Map<HealthOrderStatus, HealthOrderStatus>();
nextStatusMap.set(HealthOrderStatus.QUOTED, HealthOrderStatus.EXECUTED);
nextStatusMap.set(HealthOrderStatus.EXECUTED, HealthOrderStatus.PENDING_RESULTS);
nextStatusMap.set(HealthOrderStatus.PENDING_RESULTS, HealthOrderStatus.RESULTS_DONE);

/**
 * The only status a health order can be in to move to the given status, or undefined when no transition leads to it.
 */
export const getPreviousStatus = (status: HealthOrderStatus): HealthOrderStatus | undefined =>
  [...nextStatusMap.entries()].find(([, next]) => next === status)?.[0];

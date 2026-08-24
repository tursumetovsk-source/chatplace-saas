export interface ConsentState {
  marketingConsent: boolean;
  marketingConsentAt: Date | null;
  marketingOptOutAt: Date | null;
}

function latestDate(values: Array<Date | null | undefined>) {
  const dates = values.filter((value): value is Date => value instanceof Date);
  return dates.length ? new Date(Math.max(...dates.map(value => value.getTime()))) : null;
}

export function mergedConsent(primary: ConsentState, duplicate: ConsentState): ConsentState {
  const consentAt = latestDate([
    primary.marketingConsent ? primary.marketingConsentAt : null,
    duplicate.marketingConsent ? duplicate.marketingConsentAt : null
  ]);
  const optOutAt = latestDate([primary.marketingOptOutAt, duplicate.marketingOptOutAt]);
  const enabled = Boolean(consentAt && (!optOutAt || consentAt.getTime() > optOutAt.getTime()));
  return { marketingConsent: enabled, marketingConsentAt: consentAt, marketingOptOutAt: enabled ? null : optOutAt };
}

const deliveryPriority: Record<string, number> = { SENT: 6, PROCESSING: 5, RETRYING: 4, PENDING: 3, FAILED: 2, SKIPPED: 1 };

export function preferredDelivery<T extends { status: string; updatedAt: Date }>(first: T, second: T) {
  const firstPriority = deliveryPriority[first.status] || 0;
  const secondPriority = deliveryPriority[second.status] || 0;
  if (firstPriority !== secondPriority) return firstPriority > secondPriority ? first : second;
  return first.updatedAt.getTime() >= second.updatedAt.getTime() ? first : second;
}

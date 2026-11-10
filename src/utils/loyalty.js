export const tiers = [
  { id: 'bronze', label: 'Bronze', from: 0, multiplier: 1 },
  { id: 'silver', label: 'Silver', from: 1000, multiplier: 1.25 },
  { id: 'gold', label: 'Gold', from: 5000, multiplier: 1.5 },
];

export const POINT_VALUE_PAISE = 100;
export const MAX_REDEEM_PERCENT = 20;
const PAISE_PER_POINT_EARNED = 10000;

export function tierFor(lifetimePoints) {
  return [...tiers].reverse().find((tier) => lifetimePoints >= tier.from);
}

export function nextTier(lifetimePoints) {
  return tiers.find((tier) => tier.from > lifetimePoints) ?? null;
}

// One point per ₹100 spent, scaled by tier.
export function pointsEarned(netPaise, lifetimePoints) {
  return Math.floor((netPaise / PAISE_PER_POINT_EARNED) * tierFor(lifetimePoints).multiplier);
}

export function pointsToUse(available, payablePaise) {
  const cap = Math.floor((payablePaise * MAX_REDEEM_PERCENT) / 100 / POINT_VALUE_PAISE);
  return Math.max(0, Math.min(available, cap));
}

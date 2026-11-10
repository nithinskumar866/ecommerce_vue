// The demo has no warehouse, so an order advances with its age.
const MINUTE = 60 * 1000;

export const orderSteps = [
  { id: 'placed', label: 'Order placed', icon: 'bi-receipt', after: 0 },
  { id: 'packed', label: 'Packed', icon: 'bi-box-seam', after: 1 * MINUTE },
  { id: 'shipped', label: 'Shipped', icon: 'bi-truck', after: 3 * MINUTE },
  { id: 'delivered', label: 'Delivered', icon: 'bi-house-check', after: 6 * MINUTE },
];

export function currentStepIndex(order, now = Date.now()) {
  const age = now - new Date(order.createdAt).getTime();
  return orderSteps.reduce((reached, step, index) => (age >= step.after ? index : reached), 0);
}

export function canCancel(order, now = Date.now()) {
  return !order.cancelledAt && currentStepIndex(order, now) < 2;
}

export function statusLabel(order, now = Date.now()) {
  return order.cancelledAt ? 'Cancelled' : orderSteps[currentStepIndex(order, now)].label;
}

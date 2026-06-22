import { OrderStatus } from '../pages/order/config';

const PAYMENT_DEADLINE_THRESHOLD = 1577808000000;

export function computePaymentCountDown(order = {}) {
  if (order.orderStatus !== OrderStatus.PENDING_PAYMENT && order.status !== OrderStatus.PENDING_PAYMENT) {
    return null;
  }

  const autoCancelTime = order.autoCancelTime;
  if (!autoCancelTime) {
    return null;
  }

  if (autoCancelTime > PAYMENT_DEADLINE_THRESHOLD) {
    const remain = autoCancelTime - Date.now();
    return remain > 0 ? remain : 0;
  }

  return autoCancelTime > 0 ? autoCancelTime : 0;
}

export function formatPaymentCountDown(timeMs = 0) {
  const totalSeconds = Math.max(0, Math.floor(timeMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value) => `${value}`.padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
}

export const ORDER_STATUS = {
  PENDING_PAYMENT: '待处理',
  PENDING_DELIVERY: '待交付',
  PENDING_RECEIPT: '待收货',
  COMPLETE: '已完成',
  CANCELED: '已取消',
} as const;

export const ORDER_STATUS_NAME = {
  [ORDER_STATUS.PENDING_PAYMENT]: '待付款',
  [ORDER_STATUS.PENDING_DELIVERY]: '待交付',
  [ORDER_STATUS.PENDING_RECEIPT]: '已交付',
  [ORDER_STATUS.COMPLETE]: '已完成',
  [ORDER_STATUS.CANCELED]: '已取消',
} as const;

export type OrderStatusValue = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export function normalizeOrderStatus(status?: string): OrderStatusValue | '' {
  if (!status) return '';
  if (status === '待付款' || status === '待支付' || status === '待处理') return ORDER_STATUS.PENDING_PAYMENT;
  if (status === '已付款' || status === '待发货' || status === '待交付') return ORDER_STATUS.PENDING_DELIVERY;
  if (status === '待收货' || status === '已交付') return ORDER_STATUS.PENDING_RECEIPT;
  if (status === '已完成') return ORDER_STATUS.COMPLETE;
  return ORDER_STATUS.CANCELED;
}

export function getOrderStatusName(status: string) {
  const normalizedStatus = normalizeOrderStatus(status);
  return normalizedStatus ? ORDER_STATUS_NAME[normalizedStatus] : ORDER_STATUS_NAME[ORDER_STATUS.CANCELED];
}

export function getOrderItems(itemsDetail: unknown) {
  return Array.isArray(itemsDetail) ? (itemsDetail as Array<Record<string, unknown>>) : [];
}

export function getAdminNextStatuses(status: string): OrderStatusValue[] {
  const normalizedStatus = normalizeOrderStatus(status);
  if (normalizedStatus === ORDER_STATUS.PENDING_PAYMENT) {
    return [ORDER_STATUS.CANCELED];
  }
  if (normalizedStatus === ORDER_STATUS.PENDING_DELIVERY) {
    return [ORDER_STATUS.PENDING_RECEIPT];
  }
  if (normalizedStatus === ORDER_STATUS.PENDING_RECEIPT) {
    return [ORDER_STATUS.COMPLETE];
  }
  return [];
}

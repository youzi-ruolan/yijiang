export const ORDER_STATUS = {
  PENDING_PAYMENT: '待处理',
  PENDING_DELIVERY: '待交付',
  PENDING_RECEIPT: '待收货',
  COMPLETE: '已完成',
  CANCELED: '已取消',
} as const;

export const ORDER_STATUS_NAME: Record<string, string> = {
  [ORDER_STATUS.PENDING_PAYMENT]: '待付款',
  [ORDER_STATUS.PENDING_DELIVERY]: '待交付',
  [ORDER_STATUS.PENDING_RECEIPT]: '已交付',
  [ORDER_STATUS.COMPLETE]: '已完成',
  [ORDER_STATUS.CANCELED]: '已取消',
};

export const ORDER_STATUS_TAG_TYPE: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
  [ORDER_STATUS.PENDING_PAYMENT]: 'warning',
  [ORDER_STATUS.PENDING_DELIVERY]: 'warning',
  [ORDER_STATUS.PENDING_RECEIPT]: '',
  [ORDER_STATUS.COMPLETE]: 'success',
  [ORDER_STATUS.CANCELED]: 'danger',
};

export const ORDER_STATUS_FILTER_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '待付款', value: ORDER_STATUS.PENDING_PAYMENT },
  { label: '待交付', value: ORDER_STATUS.PENDING_DELIVERY },
  { label: '已交付', value: ORDER_STATUS.PENDING_RECEIPT },
  { label: '已完成', value: ORDER_STATUS.COMPLETE },
  { label: '已取消', value: ORDER_STATUS.CANCELED },
];

export function formatOrderAmount(amount: number) {
  return `¥${(amount / 100).toFixed(2)}`;
}

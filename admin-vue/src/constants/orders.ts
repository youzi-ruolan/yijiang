import type { OrderItem } from '@/types';

export const DEFAULT_ORDERS: OrderItem[] = [
  {
    id: 'YJ20260513001',
    customer: '青岚影像工作室',
    amount: 38800,
    status: '待交付',
    items: 3,
    createdAt: '2026-05-13 10:20',
  },
  {
    id: 'YJ20260512008',
    customer: '拾光婚礼影像',
    amount: 16900,
    status: '已完成',
    items: 2,
    createdAt: '2026-05-12 18:42',
  },
  {
    id: 'YJ20260512003',
    customer: '木白品牌视觉',
    amount: 24900,
    status: '待处理',
    items: 1,
    createdAt: '2026-05-12 11:08',
  },
  {
    id: 'YJ20260511006',
    customer: '澄片纪录工作组',
    amount: 45800,
    status: '已付款',
    items: 4,
    createdAt: '2026-05-11 16:36',
  },
];

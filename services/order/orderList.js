import { config } from '../../config/index';
import { apiRequest } from '../_utils/request';

/** 获取订单列表mock数据 */
function mockFetchOrders(params) {
  const { delay } = require('../_utils/delay');
  const { genOrders } = require('../../model/order/orderList');

  return delay(200).then(() => genOrders(params));
}

/** 获取订单列表数据 */
export function fetchOrders(params) {
  if (config.enableBackendApi) {
    const status = params?.parameter?.orderStatus;
    const query = status !== undefined && status !== -1 ? `?status=${encodeURIComponent(mapStatusToText(status))}` : '';

    return apiRequest({
      url: `/api/orders${query}`,
    }).then((data = []) => ({
      data: {
        orders: data.map((order) => ({
          orderId: order.id,
          orderNo: order.orderNo,
          parentOrderNo: order.parentOrderNo,
          storeId: '1000',
          storeName: '艺匠调色数字资产商店',
          orderStatus: mapStatusToCode(order.status),
          orderStatusName: order.status,
          paymentAmount: order.amount,
          totalAmount: order.amount,
          createTime: order.createTime,
          logisticsVO: {
            logisticsNo: '',
          },
          orderItemVOs: (order.itemsDetail || []).map((item, index) => ({
            id: `${order.id}_${index}`,
            goodsPictureUrl: item.goodsPictureUrl || '',
            goodsName: item.goodsName || '商品',
            skuId: item.skuId || '',
            spuId: item.spuId || '',
            specifications: Array.isArray(item.specifications) ? item.specifications : [],
            tagPrice: Number(item.tagPrice || item.actualPrice || 0),
            actualPrice: Number(item.actualPrice || item.tagPrice || 0),
            buyQuantity: Number(item.buyQuantity || 1),
            tagText: item.tagText || '',
          })),
          buttonVOs: [],
          groupInfoVo: null,
          freightFee: 0,
        })),
      },
    }));
  }
  if (config.useMock) {
    return mockFetchOrders(params);
  }

  return new Promise((resolve) => {
    resolve('real api');
  });
}

/** 获取订单列表mock数据 */
function mockFetchOrdersCount(params) {
  const { delay } = require('../_utils/delay');
  const { genOrdersCount } = require('../../model/order/orderList');

  return delay().then(() => genOrdersCount(params));
}

/** 获取订单列表统计 */
export function fetchOrdersCount(params) {
  if (config.enableBackendApi) {
    return apiRequest({
      url: '/api/orders/count',
    }).then((data = []) => ({
      data,
    }));
  }
  if (config.useMock) {
    return mockFetchOrdersCount(params);
  }

  return new Promise((resolve) => {
    resolve('real api');
  });
}

function mapStatusToText(statusCode) {
  if (statusCode === 5) return '待处理';
  if (statusCode === 10) return '待交付';
  if (statusCode === 40) return '待收货';
  if (statusCode === 50) return '已完成';
  return '';
}

function mapStatusToCode(statusText) {
  if (statusText === '待处理') return 5;
  if (statusText === '已付款' || statusText === '待交付') return 10;
  if (statusText === '待收货') return 40;
  if (statusText === '已完成') return 50;
  return 80;
}

import { config } from '../../config/index';
import { apiRequest } from '../_utils/request';
import { getCurrentUser } from '../../utils/local-auth';

const OrderButtonTypes = {
  CANCEL: 2,
};

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
    const currentUser = getCurrentUser();
    const queryList = [];
    if (status !== undefined && status !== -1) {
      queryList.push(`status=${encodeURIComponent(mapStatusToText(status))}`);
    }
    if (currentUser?.uid) {
      queryList.push(`uid=${encodeURIComponent(currentUser.uid)}`);
    }
    const query = queryList.length ? `?${queryList.join('&')}` : '';

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
          orderStatus: order.statusCode || mapStatusToCode(order.status),
          orderStatusName: order.statusName || mapStatusToName(order.status),
          paymentAmount: order.amount,
          totalAmount: order.amount,
          createTime: order.createTime,
          autoCancelTime: order.autoCancelTime,
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
            buttonVOs: item.buttonVOs || [],
            commented: Boolean(item.commented),
          })),
          buttonVOs: order.buttonVOs || getOrderButtons(order.status),
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

/** 取消订单 */
export function cancelOrder(orderNo) {
  if (config.enableBackendApi) {
    const currentUser = getCurrentUser();
    const query = currentUser?.uid ? `?uid=${encodeURIComponent(currentUser.uid)}` : '';
    return apiRequest({
      url: `/api/orders/${orderNo}/cancel${query}`,
      method: 'POST',
    });
  }
  if (config.useMock) {
    const { delay } = require('../_utils/delay');
    return delay(200);
  }

  return Promise.resolve();
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
    const currentUser = getCurrentUser();
    const query = currentUser?.uid ? `?uid=${encodeURIComponent(currentUser.uid)}` : '';
    return apiRequest({
      url: `/api/orders/count${query}`,
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
  if (statusCode === 10) return '已付款';
  if (statusCode === 41) return '待评价';
  if (statusCode === 42) return '已评价';
  return '';
}

function mapStatusToCode(statusText) {
  if (statusText === '待付款' || statusText === '待支付' || statusText === '待处理') return 5;
  if (statusText === '已付款' || statusText === '待发货' || statusText === '待交付') return 10;
  if (statusText === '待收货' || statusText === '已交付') return 10;
  if (statusText === '待评价') return 41;
  if (statusText === '已评价' || statusText === '已完成') return 42;
  return 80;
}

function mapStatusToName(statusText) {
  if (statusText === '待付款' || statusText === '待支付' || statusText === '待处理') return '待付款';
  if (statusText === '已付款' || statusText === '待发货' || statusText === '待交付') return '已付款';
  if (statusText === '待收货' || statusText === '已交付') return '已付款';
  if (statusText === '待评价') return '待评价';
  if (statusText === '已评价' || statusText === '已完成') return '已评价';
  return '已取消';
}

function getOrderButtons(statusText) {
  if (mapStatusToCode(statusText) !== 5) return [];
  return [{ primary: false, type: OrderButtonTypes.CANCEL, name: '取消订单' }];
}

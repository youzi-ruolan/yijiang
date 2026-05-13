import { config } from '../../config/index';
import { apiRequest } from '../_utils/request';

/** 获取订单详情mock数据 */
function mockFetchOrderDetail(params) {
  const { delay } = require('../_utils/delay');
  const { genOrderDetail } = require('../../model/order/orderDetail');

  return delay().then(() => genOrderDetail(params));
}

/** 获取订单详情数据 */
export function fetchOrderDetail(params) {
  if (config.enableBackendApi) {
    return apiRequest({
      url: `/api/orders/${params?.parameter}`,
    }).then((data) => ({
      data,
    }));
  }
  if (config.useMock) {
    return mockFetchOrderDetail(params);
  }

  return new Promise((resolve) => {
    resolve('real api');
  });
}

/** 获取客服mock数据 */
function mockFetchBusinessTime(params) {
  const { delay } = require('../_utils/delay');
  const { genBusinessTime } = require('../../model/order/orderDetail');

  return delay().then(() => genBusinessTime(params));
}

/** 获取客服数据 */
export function fetchBusinessTime(params) {
  if (config.enableBackendApi) {
    return Promise.resolve({
      data: {
        telphone: '400-100-2026',
        businessTime: ['周一至周日 09:30 - 21:00', '数字商品支持在线交付与售后咨询'],
      },
    });
  }
  if (config.useMock) {
    return mockFetchBusinessTime(params);
  }

  return new Promise((resolve) => {
    resolve('real api');
  });
}

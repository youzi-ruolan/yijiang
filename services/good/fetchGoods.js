import { config } from '../../config/index';
import { apiRequest } from '../_utils/request';

/** 获取商品列表 */
function mockFetchGoodsList(pageIndex = 1, pageSize = 20) {
  const { delay } = require('../_utils/delay');
  const { getGoodsList } = require('../../model/goods');
  return delay().then(() =>
    getGoodsList(pageIndex, pageSize).map((item) => {
      return {
        spuId: item.spuId,
        thumb: item.primaryImage,
        title: item.title,
        price: item.minSalePrice,
        originPrice: item.minSalePrice,
        tags: item.spuTagList.map((tag) => tag.title),
      };
    }),
  );
}

/** 获取商品列表 */
export function fetchGoodsList(pageIndex = 1, pageSize = 20) {
  if (config.enableBackendApi) {
    return apiRequest({
      url: '/api/products',
    }).then((goods = []) =>
      goods.slice((pageIndex - 1) * pageSize, pageIndex * pageSize).map((item) => ({
        spuId: item.id,
        thumb: item.cover,
        title: item.title,
        price: Math.round(Number(item.price || 0) * 100),
        originPrice: Math.round(Number(item.price || 0) * 100),
        tags: item.tags || [],
      })),
    );
  }
  if (config.useMock) {
    return mockFetchGoodsList(pageIndex, pageSize);
  }
  return new Promise((resolve) => {
    resolve('real api');
  });
}

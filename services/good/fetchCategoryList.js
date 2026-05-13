import { config } from '../../config/index';
import { apiRequest } from '../_utils/request';

/** 获取商品列表 */
function mockFetchGoodCategory() {
  const { delay } = require('../_utils/delay');
  const { getCategoryList } = require('../../model/category');
  return delay().then(() => getCategoryList());
}

/** 获取商品列表 */
export function getCategoryList() {
  if (config.enableBackendApi) {
    return apiRequest({
      url: '/api/categories',
    });
  }
  if (config.useMock) {
    return mockFetchGoodCategory();
  }
  return new Promise((resolve) => {
    resolve('real api');
  });
}

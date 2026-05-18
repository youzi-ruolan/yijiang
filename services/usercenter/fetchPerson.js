import { config } from '../../config/index';
import { apiRequest } from '../_utils/request';
import { getCurrentUser } from '../../utils/local-auth';

/** 获取个人中心信息 */
function mockFetchPerson() {
  const { delay } = require('../_utils/delay');
  const { genSimpleUserInfo } = require('../../model/usercenter');
  const { genAddress } = require('../../model/address');
  const address = genAddress();
  return delay().then(() => ({
    ...genSimpleUserInfo(),
    address: {
      provinceName: address.provinceName,
      provinceCode: address.provinceCode,
      cityName: address.cityName,
      cityCode: address.cityCode,
    },
  }));
}

/** 获取个人中心信息 */
export function fetchPerson() {
  if (config.enableBackendApi) {
    const currentUser = getCurrentUser();
    if (!currentUser?.uid) {
      return Promise.reject(new Error('请先登录'));
    }
    return apiRequest({
      url: `/api/person?uid=${encodeURIComponent(currentUser.uid)}`,
    });
  }
  if (config.useMock) {
    return mockFetchPerson();
  }
  return new Promise((resolve) => {
    resolve('real api');
  });
}

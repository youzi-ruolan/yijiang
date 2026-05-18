import { config } from '../../config/index';
import { apiRequest } from '../_utils/request';
import { getCurrentUser } from '../../utils/local-auth';

/** 获取个人中心信息 */
function mockFetchUserCenter() {
  const { delay } = require('../_utils/delay');
  const { genUsercenter } = require('../../model/usercenter');
  return delay(200).then(() => genUsercenter());
}

/** 获取个人中心信息 */
export function fetchUserCenter() {
  if (config.enableBackendApi) {
    const currentUser = getCurrentUser();
    const query = currentUser?.uid ? `?uid=${encodeURIComponent(currentUser.uid)}` : '';
    return apiRequest({
      url: `/api/usercenter${query}`,
    });
  }
  if (config.useMock) {
    return mockFetchUserCenter();
  }
  return new Promise((resolve) => {
    resolve('real api');
  });
}

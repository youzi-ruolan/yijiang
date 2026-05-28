import { config } from '../../config/index';
import { mergeCommentCount } from '../../utils/local-comments';
import { apiRequest } from '../_utils/request';
import { getCurrentUser } from '../../utils/local-auth';

/** 获取商品评论数 */
function mockFetchCommentsCount(ID = 0) {
  const { delay } = require('../_utils/delay');
  const { getGoodsCommentsCount } = require('../../model/comments');
  const spuId = typeof ID === 'object' ? ID?.spuId : ID;
  return delay().then(() => mergeCommentCount(spuId, getGoodsCommentsCount(ID)));
}

/** 获取商品评论数 */
export function fetchCommentsCount(ID = 0) {
  if (config.enableBackendApi) {
    const currentUser = getCurrentUser();
    const spuId = typeof ID === 'object' ? ID?.spuId : ID;
    return apiRequest({
      url: '/api/comments/count',
      method: 'POST',
      data: {
        spuId,
        uid: currentUser?.uid || '',
      },
    });
  }
  if (config.useMock) {
    return mockFetchCommentsCount(ID);
  }
  return new Promise((resolve) => {
    resolve('real api');
  });
}

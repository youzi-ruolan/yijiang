import { config } from '../../config/index';
import { mergeCommentPage } from '../../utils/local-comments';
import { apiRequest } from '../_utils/request';
import { getCurrentUser } from '../../utils/local-auth';

/** 获取商品评论 */
function mockFetchComments(params) {
  const { delay } = require('../_utils/delay');
  const { getGoodsAllComments } = require('../../model/comments');
  return delay().then(() => mergeCommentPage(params, getGoodsAllComments(params)));
}

/** 获取商品评论 */
export function fetchComments(params) {
  if (config.enableBackendApi) {
    const currentUser = getCurrentUser();
    return apiRequest({
      url: '/api/comments/list',
      method: 'POST',
      data: {
        ...params,
        queryParameter: {
          ...(params?.queryParameter || {}),
          uid: currentUser?.uid || '',
        },
      },
    });
  }
  if (config.useMock) {
    return mockFetchComments(params);
  }
  return new Promise((resolve) => {
    resolve('real api');
  });
}

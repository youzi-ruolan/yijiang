import { config } from '../../config/index';
import { mergeCommentPage } from '../../utils/local-comments';

/** 获取商品评论 */
function mockFetchComments(params) {
  const { delay } = require('../_utils/delay');
  const { getGoodsAllComments } = require('../../model/comments');
  return delay().then(() => mergeCommentPage(params, getGoodsAllComments(params)));
}

/** 获取商品评论 */
export function fetchComments(params) {
  if (config.useMock) {
    return mockFetchComments(params);
  }
  return new Promise((resolve) => {
    resolve('real api');
  });
}

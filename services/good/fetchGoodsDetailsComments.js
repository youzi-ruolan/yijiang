import { config } from '../../config/index';
import { mergeCommentCount, mergeHomeComments } from '../../utils/local-comments';

/** 获取商品详情页评论数 */
function mockFetchGoodDetailsCommentsCount(spuId = 0) {
  const { delay } = require('../_utils/delay');
  const { getGoodsDetailsCommentsCount } = require('../../model/detailsComments');
  return delay().then(() => mergeCommentCount(spuId, getGoodsDetailsCommentsCount(spuId)));
}

/** 获取商品详情页评论数 */
export function getGoodsDetailsCommentsCount(spuId = 0) {
  if (config.useMock) {
    return mockFetchGoodDetailsCommentsCount(spuId);
  }
  return new Promise((resolve) => {
    resolve('real api');
  });
}

/** 获取商品详情页评论 */
function mockFetchGoodDetailsCommentList(spuId = 0) {
  const { delay } = require('../_utils/delay');
  const { getGoodsDetailsComments } = require('../../model/detailsComments');
  return delay().then(() => mergeHomeComments(spuId, getGoodsDetailsComments(spuId)));
}

/** 获取商品详情页评论 */
export function getGoodsDetailsCommentList(spuId = 0) {
  if (config.useMock) {
    return mockFetchGoodDetailsCommentList(spuId);
  }
  return new Promise((resolve) => {
    resolve('real api');
  });
}

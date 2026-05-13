/* eslint-disable no-param-reassign */
import { config } from '../../config/index';
import { apiRequest } from '../_utils/request';

/** 获取搜索历史 */
function mockSearchResult(params) {
  const { delay } = require('../_utils/delay');
  const { getSearchResult } = require('../../model/search');

  const data = getSearchResult(params);

  if (data.spuList.length) {
    data.spuList.forEach((item) => {
      item.spuId = item.spuId;
      item.thumb = item.primaryImage;
      item.title = item.title;
      item.price = item.minSalePrice;
      item.originPrice = item.maxLinePrice;
      if (item.spuTagList) {
        item.tags = item.spuTagList.map((tag) => ({ title: tag.title }));
      } else {
        item.tags = [];
      }
    });
  }
  return delay().then(() => {
    return data;
  });
}

/** 获取搜索历史 */
export function getSearchResult(params) {
  if (config.enableBackendApi) {
    return apiRequest({
      url: '/api/products',
    }).then((goods = []) => {
      const keyword = `${params?.keyword || ''}`.trim().toLowerCase();
      const minPrice = Number(params?.minPrice || 0);
      const maxPrice = params?.maxPrice === undefined ? Infinity : Number(params.maxPrice || 0);
      const pageNum = Number(params?.pageNum || 1);
      const pageSize = Number(params?.pageSize || 30);
      const sort = Number(params?.sort || 0);
      const sortType = Number(params?.sortType || 0);

      let list = goods
        .filter((item) => {
          if (!keyword) return true;
          return `${item.title || ''}${item.description || ''}`.toLowerCase().includes(keyword);
        })
        .filter((item) => {
          const price = Math.round(Number(item.price || 0) * 100);
          return price >= minPrice && price <= maxPrice;
        })
        .map((item) => ({
          spuId: item.id,
          thumb: item.cover,
          title: item.title,
          price: Math.round(Number(item.price || 0) * 100),
          originPrice: Math.round(Number(item.originalPrice || 0) * 100),
          desc: item.description || '',
          tags: item.tags || [],
          primaryImage: item.cover,
        }));

      if (sort === 1) {
        list = list.sort((prev, next) => (sortType === 1 ? next.price - prev.price : prev.price - next.price));
      }

      const totalCount = list.length;
      const start = (pageNum - 1) * pageSize;
      const end = start + pageSize;

      return {
        spuList: list.slice(start, end),
        totalCount,
      };
    });
  }
  if (config.useMock) {
    return mockSearchResult(params);
  }
  return new Promise((resolve) => {
    resolve('real api');
  });
}

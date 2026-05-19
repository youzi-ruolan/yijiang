/* eslint-disable no-param-reassign */
import { config } from '../../config/index';
import { apiRequest } from '../_utils/request';

function buildSearchText(item = {}) {
  const tags = Array.isArray(item.tags) ? item.tags.join(' ') : '';
  return `${item.title || ''} ${item.description || ''} ${tags} ${item.category || ''}`.toLowerCase();
}

function compareRecommendPriority(prev, next) {
  const prevHot = prev.isHot ? 1 : 0;
  const nextHot = next.isHot ? 1 : 0;
  if (prevHot !== nextHot) return nextHot - prevHot;

  const prevNew = prev.isNew ? 1 : 0;
  const nextNew = next.isNew ? 1 : 0;
  if (prevNew !== nextNew) return nextNew - prevNew;

  const prevSales = Number(prev.sales || 0);
  const nextSales = Number(next.sales || 0);
  if (prevSales !== nextSales) return nextSales - prevSales;

  const prevSort = Number(prev.sort || 0);
  const nextSort = Number(next.sort || 0);
  if (prevSort !== nextSort) return prevSort - nextSort;

  return `${prev.title || ''}`.localeCompare(`${next.title || ''}`, 'zh-Hans-CN');
}

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
          return buildSearchText(item).includes(keyword);
        })
        .filter((item) => {
          const price = Math.round(Number(item.price || 0) * 100);
          return price >= minPrice && price <= maxPrice;
        });

      if (!keyword) {
        list = list.sort(compareRecommendPriority);
      }

      list = list
        .map((item) => ({
          spuId: item.id,
          thumb: item.cover,
          title: item.title,
          price: Math.round(Number(item.price || 0) * 100),
          originPrice: Math.round(Number(item.price || 0) * 100),
          desc: item.description || '',
          tags: item.tags || [],
          primaryImage: item.cover,
          isHot: Boolean(item.isHot),
          isNew: Boolean(item.isNew),
          sales: Number(item.sales || 0),
          sort: Number(item.sort || 0),
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

import { config } from '../../config/index';
import { apiRequest } from '../_utils/request';

const SEARCH_HISTORY_KEY = 'colorist.search.history';
const DEFAULT_POPULAR_WORDS = [
  '人像肤色',
  '胶片仿真',
  '婚礼纪实',
  '商业广告',
  '纪录片',
  'DaVinci 节点',
  '交付流程',
  'LUT',
];

function collectPopularWords(products = []) {
  const bucket = new Map();
  const pushWord = (word, score = 1) => {
    const value = `${word || ''}`.trim();
    if (!value || value.length < 2 || value.length > 18) return;
    bucket.set(value, (bucket.get(value) || 0) + score);
  };

  products.forEach((product) => {
    const tags = Array.isArray(product?.tags) ? product.tags : [];
    tags.forEach((tag, index) => pushWord(tag, Math.max(6 - index, 2)));

    const title = `${product?.title || ''}`.trim();
    if (title) {
      pushWord(title, 1);
      title
        .split(/[\/|｜·\s]+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => pushWord(item, 1));
    }
  });

  const words = [...bucket.entries()]
    .sort((prev, next) => next[1] - prev[1])
    .map(([word]) => word)
    .slice(0, 8);

  return words.length ? words : DEFAULT_POPULAR_WORDS;
}

function safeGetStorage(key, fallback) {
  try {
    return wx.getStorageSync(key) || fallback;
  } catch (error) {
    return fallback;
  }
}

function safeSetStorage(key, value) {
  try {
    wx.setStorageSync(key, value);
  } catch (error) {
    console.error('set storage error', error);
  }
}

/** 获取搜索历史 */
function mockSearchHistory() {
  const { delay } = require('../_utils/delay');
  const { getSearchHistory } = require('../../model/search');
  return delay().then(() => getSearchHistory());
}

/** 获取搜索历史 */
export function getSearchHistory() {
  if (config.enableBackendApi) {
    return new Promise((resolve) => {
      resolve({
        historyWords: safeGetStorage(SEARCH_HISTORY_KEY, []),
      });
    });
  }
  if (config.useMock) {
    return mockSearchHistory();
  }
  return new Promise((resolve) => {
    resolve({
      historyWords: safeGetStorage(SEARCH_HISTORY_KEY, []),
    });
  });
}

/** 获取搜索历史 */
function mockSearchPopular() {
  const { delay } = require('../_utils/delay');
  const { getSearchPopular } = require('../../model/search');
  return delay().then(() => getSearchPopular());
}

/** 获取搜索历史 */
export function getSearchPopular() {
  if (config.enableBackendApi) {
    return apiRequest({
      url: '/api/products',
    })
      .then((products = []) => ({
        popularWords: collectPopularWords(products),
      }))
      .catch(() => ({
        popularWords: DEFAULT_POPULAR_WORDS,
      }));
  }
  if (config.useMock) {
    return mockSearchPopular();
  }
  return new Promise((resolve) => {
    resolve({
      popularWords: DEFAULT_POPULAR_WORDS,
    });
  });
}

export function saveSearchHistory(keyword = '') {
  const nextKeyword = `${keyword}`.trim();
  if (!nextKeyword) {
    return [];
  }

  const currentHistory = safeGetStorage(SEARCH_HISTORY_KEY, []);
  const nextHistory = [nextKeyword, ...currentHistory.filter((item) => item !== nextKeyword)].slice(0, 12);
  safeSetStorage(SEARCH_HISTORY_KEY, nextHistory);
  return nextHistory;
}

export function clearSearchHistory() {
  safeSetStorage(SEARCH_HISTORY_KEY, []);
  return [];
}

export function deleteSearchHistoryItem(index) {
  const currentHistory = safeGetStorage(SEARCH_HISTORY_KEY, []);
  const nextHistory = currentHistory.filter((_, currentIndex) => currentIndex !== index);
  safeSetStorage(SEARCH_HISTORY_KEY, nextHistory);
  return nextHistory;
}

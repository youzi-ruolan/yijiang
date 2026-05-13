import { config } from '../../config/index';

const SEARCH_HISTORY_KEY = 'colorist.search.history';
const DEFAULT_POPULAR_WORDS = [
  '小红书调色预设',
  '人像奶油风 LUT',
  '婚礼纪实调色包',
  '胶片复古预设',
  '室内静物调色模板',
  '旅拍清透风格',
  '短视频电影感 LUT',
  '日系通透滤镜',
];

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
    return new Promise((resolve) => {
      resolve({
        popularWords: DEFAULT_POPULAR_WORDS,
      });
    });
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

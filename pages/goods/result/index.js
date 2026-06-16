import { getSearchResult } from '../../../services/good/fetchSearchResult';
import Toast from 'tdesign-miniprogram/toast/index';
import { saveSearchHistory } from '../../../services/good/fetchSearchHistory';

function normalizeTags(tags = []) {
  return tags
    .map((item) => (typeof item === 'string' ? item : item?.title || ''))
    .filter(Boolean);
}

function normalizeSearchProduct(item = {}, isRecommendMode = false) {
  const baseTags = normalizeTags(item.tags);
  const recommendTags = isRecommendMode
    ? [item.isHot ? '热门' : '', item.isNew ? '新品' : ''].filter(Boolean)
    : [];
  const priceYuan = Number(item.price || 0) / 100;
  const originYuan = Number(item.originPrice || 0) / 100;

  return {
    ...item,
    cover: item.thumb || item.primaryImage || item.cover || '',
    displayDescription: item.desc || item.description || '',
    tags: [...recommendTags, ...baseTags].slice(0, 2),
    price: priceYuan,
    originalPrice: originYuan > priceYuan ? originYuan : priceYuan,
    format: item.format || baseTags[0] || '',
  };
}

Page({
  data: {
    goodsList: [],
    hasLoaded: false,
    keywords: '',
    isRecommendMode: false,
    loadMoreStatus: 0,
    loading: true,
    totalCount: 0,
  },

  total: 0,
  pageNum: 1,
  pageSize: 30,

  onLoad(options) {
    const { searchValue = '' } = options || {};
    this.setData(
      {
        keywords: searchValue,
        isRecommendMode: !`${searchValue}`.trim(),
      },
      () => {
        this.init(true);
      },
    );
  },

  onShow() {},

  generalQueryData(reset = false) {
    const { keywords } = this.data;
    const pageNum = reset ? 1 : this.pageNum + 1;
    return {
      sort: 0,
      pageNum,
      pageSize: this.pageSize,
      keyword: keywords,
    };
  },

  async init(reset = true) {
    const { loadMoreStatus, goodsList = [] } = this.data;
    if (loadMoreStatus === 1) return;

    const params = this.generalQueryData(reset);
    this.setData({
      loadMoreStatus: 1,
      loading: true,
    });

    try {
      const result = await getSearchResult(params);
      const { spuList = [], totalCount = 0 } = result || {};
      const isRecommendMode = !`${this.data.keywords || ''}`.trim();
      const mappedList = spuList.map((item) => normalizeSearchProduct(item, isRecommendMode));
      const nextGoodsList = reset ? mappedList : goodsList.concat(mappedList);

      this.pageNum = params.pageNum;
      this.total = totalCount;
      this.setData({
        goodsList: nextGoodsList,
        totalCount,
        isRecommendMode,
        hasLoaded: true,
        loading: false,
        loadMoreStatus: nextGoodsList.length >= totalCount ? 2 : 0,
      });
    } catch (error) {
      this.setData({
        hasLoaded: true,
        loading: false,
        loadMoreStatus: 0,
      });
      Toast({
        context: this,
        selector: '#t-toast',
        message: '搜索失败，请稍后重试',
      });
    }
  },

  onInputChange(e) {
    this.setData({
      keywords: `${e.detail.value || ''}`,
    });
  },

  handleSubmit(e) {
    const inputValue = e && e.detail ? e.detail.value : '';
    const value = `${inputValue || this.data.keywords || ''}`.trim();
    if (!value) return;

    saveSearchHistory(value);
    this.pageNum = 1;
    this.setData(
      {
        keywords: value,
        isRecommendMode: false,
        goodsList: [],
        totalCount: 0,
        hasLoaded: false,
        loadMoreStatus: 0,
      },
      () => {
        this.init(true);
      },
    );
  },

  clearKeywords() {
    this.pageNum = 1;
    this.total = 0;
    this.setData(
      {
        keywords: '',
        isRecommendMode: true,
        goodsList: [],
        totalCount: 0,
        hasLoaded: false,
        loadMoreStatus: 0,
        loading: true,
      },
      () => {
        this.init(true);
      },
    );
  },

  onReachBottom() {
    const { goodsList } = this.data;
    if (goodsList.length >= this.total) {
      this.setData({ loadMoreStatus: 2 });
      return;
    }
    this.init(false);
  },

  openProductCard(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/goods/details/index?spuId=${id}`,
    });
  },
});

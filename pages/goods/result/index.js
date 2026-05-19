import { getSearchResult } from '../../../services/good/fetchSearchResult';
import Toast from 'tdesign-miniprogram/toast/index';
import { addLocalCartItem, getLocalCartCount } from '../../../utils/local-cart';
import { buildCartItemFromGoods } from '../../../utils/cart-item';
import { saveSearchHistory } from '../../../services/good/fetchSearchHistory';

Page({
  data: {
    goodsList: [],
    hasLoaded: false,
    keywords: '',
    isRecommendMode: false,
    loadMoreStatus: 0,
    loading: true,
    cartNum: 0,
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

  onShow() {
    this.refreshCartCount();
  },

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
      const nextGoodsList = reset ? spuList : goodsList.concat(spuList);
      const isRecommendMode = !`${this.data.keywords || ''}`.trim();

      nextGoodsList.forEach((item) => {
        const baseTags = Array.isArray(item.tags) ? item.tags : [];
        const recommendTags = isRecommendMode
          ? [item.isHot ? '热门' : '', item.isNew ? '新品' : ''].filter(Boolean)
          : [];
        item.tags = [...recommendTags, ...baseTags].slice(0, 2);
        item.hideKey = { desc: true };
      });

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

  handleCartTap() {
    wx.switchTab({
      url: '/pages/cart/index',
    });
  },

  refreshCartCount() {
    this.setData({
      cartNum: getLocalCartCount(),
    });
  },

  handleAddCart(event) {
    const { index } = event.detail;
    const goods = this.data.goodsList[index];
    if (!goods) return;

    addLocalCartItem(buildCartItemFromGoods(goods));
    this.refreshCartCount();
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar && tabBar.updateCartCount) {
      tabBar.updateCartCount();
    }
    Toast({
      context: this,
      selector: '#t-toast',
      message: '已加入购物车',
    });
  },

  gotoGoodsDetail(e) {
    const { index } = e.detail;
    const { spuId } = this.data.goodsList[index];
    wx.navigateTo({
      url: `/pages/goods/details/index?spuId=${spuId}`,
    });
  },
});

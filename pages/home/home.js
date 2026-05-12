import { HOME_MOCK } from './mock';

Page({
  data: {
    appInfo: HOME_MOCK.app,
    metrics: HOME_MOCK.metrics,
    bannerList: HOME_MOCK.banners,
    categoryList: HOME_MOCK.categories,
    inspirationList: HOME_MOCK.inspirations,
    productList: HOME_MOCK.products,
    filteredProductList: HOME_MOCK.products,
    articleList: HOME_MOCK.articles,
    pageLoading: false,
    activeCategoryId: 'all',
    currentBannerIndex: 0,
    autoplay: true,
    duration: 700,
    interval: 5200,
  },

  onShow() {
    this.getTabBar().init();
  },

  onLoad() {
    this.init();
  },

  onReachBottom() {
    if (this.data.goodsListLoadStatus === 0) {
      this.loadGoodsList();
    }
  },

  onPullDownRefresh() {
    this.init();
  },

  init() {
    this.setData({
      pageLoading: true,
      currentBannerIndex: 0,
      activeCategoryId: 'all',
      filteredProductList: HOME_MOCK.products,
    });

    setTimeout(() => {
      this.setData({
        pageLoading: false,
        metrics: HOME_MOCK.metrics,
        bannerList: HOME_MOCK.banners,
        categoryList: HOME_MOCK.categories,
        inspirationList: HOME_MOCK.inspirations,
        productList: HOME_MOCK.products,
        filteredProductList: HOME_MOCK.products,
        articleList: HOME_MOCK.articles,
      });
      wx.stopPullDownRefresh();
    }, 240);
  },

  onBannerChange(event) {
    this.setData({
      currentBannerIndex: event.detail.current,
    });
  },

  onBannerAction() {
    wx.showToast({
      title: '已进入精选推荐',
      icon: 'none',
    });
  },

  onCategoryTap(event) {
    const { id, filterKey, target } = event.currentTarget.dataset;
    const filteredProductList =
      filterKey && filterKey !== 'all'
        ? HOME_MOCK.products.filter((item) => item.category === filterKey)
        : HOME_MOCK.products;

    this.setData({
      activeCategoryId: id,
      filteredProductList,
    });

    if (target) {
      this.scrollToSection(target);
    }
  },

  toggleFavorite(event) {
    const { id } = event.currentTarget.dataset;
    const nextProductList = this.data.productList.map((item) => {
      if (item.id !== id) {
        return item;
      }

      return {
        ...item,
        favorited: !item.favorited,
        favorites: item.favorited ? item.favorites - 1 : item.favorites + 1,
      };
    });

    const nextFilteredProductList = nextProductList.filter((item) => {
      const activeCategory = this.data.activeCategoryId;
      if (activeCategory === 'all') {
        return true;
      }
      const category = HOME_MOCK.categories.find((entry) => entry.id === activeCategory);
      if (!category || category.filterKey === 'all') {
        return true;
      }
      return item.category === category.filterKey;
    });

    this.setData({
      productList: nextProductList,
      filteredProductList: nextFilteredProductList,
    });
  },

  openProductCard(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/goods/details/index?spuId=${id}`,
    });
  },

  openArticleCard() {
    wx.showToast({
      title: '文章详情待接入',
      icon: 'none',
    });
  },

  navToSearchPage() {
    wx.navigateTo({ url: '/pages/goods/search/index' });
  },

  navToCartPage() {
    wx.switchTab({
      url: '/pages/cart/index',
    });
  },

  scrollToSection(sectionId) {
    const query = wx.createSelectorQuery().in(this);
    query.select(`#${sectionId}`).boundingClientRect();
    query.selectViewport().scrollOffset();
    query.exec((res) => {
      const rect = res?.[0];
      const viewport = res?.[1];
      if (!rect || !viewport) {
        return;
      }

      wx.pageScrollTo({
        scrollTop: rect.top + viewport.scrollTop - 20,
        duration: 300,
      });
    });
  },
});

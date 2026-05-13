import { HOME_MOCK } from './mock';
import { addLocalCartItem } from '../../utils/local-cart';
import { fetchHome } from '../../services/home/home';
import { buildCartItemFromGoods } from '../../utils/cart-item';

function buildDefaultState() {
  return {
    appInfo: HOME_MOCK.app,
    headline: HOME_MOCK.headline,
    metrics: HOME_MOCK.metrics,
    quickEntryList: HOME_MOCK.quickEntries,
    bannerList: HOME_MOCK.banners,
    categoryList: HOME_MOCK.categories,
    inspirationList: HOME_MOCK.inspirations,
    creatorList: HOME_MOCK.creators,
    productList: HOME_MOCK.products,
    filteredProductList: HOME_MOCK.products,
    articleList: HOME_MOCK.articles,
  };
}

function normalizeHomePayload(payload = {}) {
  const fallback = buildDefaultState();
  const products = payload.products?.length ? payload.products : fallback.productList;
  const categories = payload.categories?.length ? payload.categories : fallback.categoryList;

  return {
    appInfo: {
      name: payload.app?.appName || fallback.appInfo.name,
      slogan: payload.app?.appSlogan || fallback.appInfo.slogan,
      version: fallback.appInfo.version,
    },
    headline: {
      ...fallback.headline,
      title: payload.headline?.title || fallback.headline.title,
      subtitle: payload.headline?.subtitle || fallback.headline.subtitle,
    },
    metrics: fallback.metrics,
    quickEntryList: fallback.quickEntryList,
    bannerList: payload.banners?.length ? payload.banners : fallback.bannerList,
    categoryList: categories,
    inspirationList: payload.inspirations?.length ? payload.inspirations : fallback.inspirationList,
    creatorList: fallback.creatorList,
    productList: products,
    filteredProductList: products,
    articleList: payload.articles?.length ? payload.articles : fallback.articleList,
  };
}

Page({
  data: {
    ...buildDefaultState(),
    pageLoading: false,
    activeCategoryId: 'all',
    currentBannerIndex: 0,
    autoplay: true,
    duration: 700,
    interval: 5200,
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar && tabBar.init) {
      tabBar.init();
    }
  },

  onLoad() {
    this.init();
  },

  onPullDownRefresh() {
    this.init();
  },

  async init() {
    this.setData({
      pageLoading: true,
      currentBannerIndex: 0,
      activeCategoryId: 'all',
      filteredProductList: this.data.productList,
    });

    try {
      const payload = await fetchHome();
      this.setData({
        pageLoading: false,
        ...normalizeHomePayload(payload),
      });
    } catch (error) {
      this.setData({
        pageLoading: false,
        ...buildDefaultState(),
      });
      wx.showToast({
        title: '接口异常，已使用本地数据',
        icon: 'none',
      });
    } finally {
      wx.stopPullDownRefresh();
    }
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

  onQuickEntryTap(event) {
    const { target } = event.currentTarget.dataset;
    if (target) {
      this.scrollToSection(target);
      return;
    }

    wx.showToast({
      title: '功能建设中',
      icon: 'none',
    });
  },

  onCategoryTap(event) {
    const { id, filterKey, target } = event.currentTarget.dataset;
    const sourceProducts = this.data.productList || [];
    const filteredProductList =
      filterKey && filterKey !== 'all'
        ? sourceProducts.filter((item) => item.category === filterKey)
        : sourceProducts;

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
      const category = this.data.categoryList.find((entry) => entry.id === activeCategory);
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

  addToCart(event) {
    const { id, title } = event.currentTarget.dataset;
    const goods = this.data.productList.find((item) => item.id === id);
    if (goods) {
      addLocalCartItem(
        buildCartItemFromGoods({
          spuId: goods.id,
          skuId: `${goods.id}_standard`,
          title: goods.title,
          thumb: goods.cover,
          primaryImage: goods.cover,
          price: Math.round(goods.price * 100),
          originPrice: Math.round(goods.originalPrice * 100),
          tags: goods.tags,
        }),
      );
      const tabBar = this.getTabBar && this.getTabBar();
      if (tabBar && tabBar.updateCartCount) {
        tabBar.updateCartCount();
      }
    }
    wx.showToast({
      title: `${title} 已加入清单`,
      icon: 'none',
    });
  },

  onCreatorTap() {
    wx.showToast({
      title: '创作者主页待接入',
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

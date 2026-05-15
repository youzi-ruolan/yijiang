import { HOME_MOCK } from './mock';
import { addLocalCartItem } from '../../utils/local-cart';
import { fetchHome } from '../../services/home/home';
import { buildCartItemFromGoods } from '../../utils/cart-item';

function normalizeProductCategories(categories = []) {
  const productCategories = categories.filter((item) => item.id === 'all' || item.target === 'productSection');
  const normalizedCategories = productCategories.length ? productCategories : categories;
  const hasAllCategory = normalizedCategories.some((item) => item.filterKey === 'all');

  if (hasAllCategory) {
    return normalizedCategories;
  }

  return [{ id: 'all', name: '全部', filterKey: 'all', target: 'productSection' }, ...normalizedCategories];
}

function normalizeProducts(products = []) {
  return products.map((item) => ({
    ...item,
    displayDescription: item.description || item.accent || '',
  }));
}

function buildDefaultState() {
  const products = normalizeProducts(HOME_MOCK.products);

  return {
    appInfo: HOME_MOCK.app,
    headline: HOME_MOCK.headline,
    bannerList: HOME_MOCK.banners,
    categoryList: normalizeProductCategories(HOME_MOCK.categories),
    productList: products,
    filteredProductList: products,
  };
}

function normalizeHomePayload(payload = {}) {
  const fallback = buildDefaultState();
  const products = normalizeProducts(payload.products?.length ? payload.products : fallback.productList);
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
    bannerList: payload.banners?.length ? payload.banners : fallback.bannerList,
    categoryList: normalizeProductCategories(categories),
    productList: products,
    filteredProductList: products,
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

  onBannerAction(event) {
    const { id } = event.currentTarget.dataset;
    const products = this.data.productList || [];
    const product = products.find((item) => item.id === id) || products[this.data.currentBannerIndex] || products[0];

    if (!product) {
      return;
    }

    wx.navigateTo({
      url: `/pages/goods/details/index?spuId=${product.id}`,
    });
  },

  onCategoryTap(event) {
    const { id, filterKey } = event.currentTarget.dataset;
    const sourceProducts = this.data.productList || [];
    const filteredProductList =
      filterKey && filterKey !== 'all' ? sourceProducts.filter((item) => item.category === filterKey) : sourceProducts;

    this.setData({
      activeCategoryId: id,
      filteredProductList,
    });
  },

  openProductCard(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/goods/details/index?spuId=${id}`,
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
          originPrice: Math.round(goods.price * 100),
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

  navToSearchPage() {
    wx.navigateTo({ url: '/pages/goods/search/index' });
  },
});

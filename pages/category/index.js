import { HOME_MOCK } from '../home/mock';
import { fetchHome } from '../../services/home/home';

function buildProductChild(product) {
  return {
    id: product.id,
    name: product.title,
    thumbnail: product.cover,
    type: 'product',
    spuId: product.id,
  };
}

function buildInspirationChild(item) {
  return {
    id: item.id,
    name: item.title,
    thumbnail: item.cover,
    type: 'inspiration',
  };
}

function buildArticleChild(item) {
  return {
    id: item.id,
    name: item.title,
    thumbnail: item.cover,
    type: 'article',
  };
}

function buildCategoryList(source = HOME_MOCK) {
  const { categories = [], products = [], inspirations = [], articles = [] } = source;

  return categories.map((category) => {
    let children = [];

    if (category.target === 'inspirationSection') {
      children = inspirations.map(buildInspirationChild);
    } else if (category.target === 'articleSection') {
      children = articles.map(buildArticleChild);
    } else if (category.filterKey && category.filterKey !== 'all') {
      children = products.filter((item) => item.category === category.filterKey).map(buildProductChild);
    } else {
      children = products.map(buildProductChild);
    }

    return {
      id: category.id,
      name: category.name,
      thumbnail: children[0]?.thumbnail || '',
      count: children.length,
      description:
        category.target === 'inspirationSection'
          ? '查看案例灵感与色彩方向'
          : category.target === 'articleSection'
          ? '浏览调色技巧与专题内容'
          : `精选 ${children.length} 个可直接使用的商品`,
      children,
    };
  });
}

Page({
  data: {
    list: [],
    activeIndex: 0,
    activeCategory: null,
  },

  async init() {
    try {
      const payload = await fetchHome();
      const list = buildCategoryList({
        categories: payload.categories || HOME_MOCK.categories,
        products: payload.products || HOME_MOCK.products,
        inspirations: payload.inspirations || HOME_MOCK.inspirations,
        articles: payload.articles || HOME_MOCK.articles,
      });
      this.setData({
        list,
        activeIndex: 0,
        activeCategory: list[0] || null,
      });
    } catch (error) {
      const list = buildCategoryList();
      this.setData({
        list,
        activeIndex: 0,
        activeCategory: list[0] || null,
      });
    }
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    tabBar && tabBar.init && tabBar.init();
  },

  onChange(event) {
    const { item } = event.detail;
    if (!item) {
      return;
    }

    if (item.type === 'product' && item.spuId) {
      wx.navigateTo({
        url: `/pages/goods/details/index?spuId=${item.spuId}`,
      });
      return;
    }

    wx.showToast({
      title: '内容详情待接入',
      icon: 'none',
    });
  },

  onCategoryTabChange(event) {
    const [activeIndex = 0] = event.detail || [];
    this.setData({
      activeIndex,
      activeCategory: this.data.list[activeIndex] || null,
    });
  },

  onSearchTap() {
    wx.navigateTo({
      url: '/pages/goods/search/index',
    });
  },

  onLoad() {
    this.init();
  },
});

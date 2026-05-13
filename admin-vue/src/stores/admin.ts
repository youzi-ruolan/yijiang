import { defineStore } from 'pinia';
import type {
  AdminDataset,
  ArticleItem,
  BannerItem,
  CategoryItem,
  InspirationItem,
  OrderItem,
  ProductItem,
} from '@/types';
import {
  createArticleApi,
  createBannerApi,
  createCategoryApi,
  createInspirationApi,
  createOrderApi,
  createProductApi,
  deleteArticleApi,
  deleteBannerApi,
  deleteCategoryApi,
  deleteInspirationApi,
  deleteOrderApi,
  deleteProductApi,
  getArticlesApi,
  getBannersApi,
  getCategoriesApi,
  getInspirationsApi,
  getOrdersApi,
  getProductsApi,
  getSettingsApi,
  mapOrderFromApi,
  mapProductFromApi,
  mapSettingsToDataset,
  updateArticleApi,
  updateBannerApi,
  updateCategoryApi,
  updateInspirationApi,
  updateOrderApi,
  updateProductApi,
  updateSettingsApi,
} from '@/api/admin';

function createEmptyDataset(): AdminDataset {
  return {
    app: {
      name: '艺匠调色',
      slogan: '电影级调色资产与交付工作流库',
      version: '3.0.0',
    },
    headline: {
      title: '把风格、流程与交付一次做专业',
      subtitle: 'LUT / PowerGrade / ACES / 商业交付模板',
    },
    banners: [],
    categories: [],
    inspirations: [],
    articles: [],
    products: [],
    orders: [],
  };
}

export const useAdminStore = defineStore('admin', {
  state: () => ({
    dataset: createEmptyDataset() as AdminDataset,
    initialized: false,
    loading: false,
  }),

  getters: {
    productCategories(state) {
      return state.dataset.categories.filter((item) => item.target === 'productSection');
    },
  },

  actions: {
    async bootstrap(force = false) {
      if (this.loading) return;
      if (this.initialized && !force) return;

      this.loading = true;
      try {
        const [settings, categories, banners, inspirations, articles, products, orders] = await Promise.all([
          getSettingsApi(),
          getCategoriesApi(),
          getBannersApi(),
          getInspirationsApi(),
          getArticlesApi(),
          getProductsApi(),
          getOrdersApi(),
        ]);

        const mappedSettings = mapSettingsToDataset(settings);

        this.dataset = {
          app: {
            ...this.dataset.app,
            name: mappedSettings.appName,
            slogan: mappedSettings.appSlogan,
          },
          headline: {
            ...this.dataset.headline,
            title: mappedSettings.headlineTitle,
            subtitle: mappedSettings.headlineSubtitle,
          },
          banners,
          categories,
          inspirations,
          articles,
          products: products.map(mapProductFromApi),
          orders: orders.map(mapOrderFromApi),
        };

        this.initialized = true;
      } finally {
        this.loading = false;
      }
    },

    resetState() {
      this.dataset = createEmptyDataset();
      this.initialized = false;
      this.loading = false;
    },

    async saveSettings(payload: {
      appName: string;
      appSlogan: string;
      headlineTitle: string;
      headlineSubtitle: string;
    }) {
      const response = await updateSettingsApi(payload);
      const mapped = mapSettingsToDataset(response);
      this.dataset.app.name = mapped.appName;
      this.dataset.app.slogan = mapped.appSlogan;
      this.dataset.headline.title = mapped.headlineTitle;
      this.dataset.headline.subtitle = mapped.headlineSubtitle;
    },

    async upsertProduct(payload: ProductItem) {
      const response =
        payload.id && this.dataset.products.some((item) => item.id === payload.id)
          ? await updateProductApi(payload.id, payload)
          : await createProductApi(payload);
      const nextProduct = mapProductFromApi(response);
      const index = this.dataset.products.findIndex((item) => item.id === nextProduct.id);

      if (index > -1) {
        this.dataset.products.splice(index, 1, nextProduct);
      } else {
        this.dataset.products.unshift(nextProduct);
      }
    },

    async removeProduct(productId: string) {
      await deleteProductApi(productId);
      this.dataset.products = this.dataset.products.filter((item) => item.id !== productId);
    },

    async upsertCategory(payload: CategoryItem) {
      const exists = this.dataset.categories.some((item) => item.id === payload.id);
      const response = exists ? await updateCategoryApi(payload.id, payload) : await createCategoryApi(payload);
      const index = this.dataset.categories.findIndex((item) => item.id === response.id);

      if (index > -1) {
        this.dataset.categories.splice(index, 1, response);
      } else {
        this.dataset.categories.push(response);
      }
    },

    async removeCategory(categoryId: string) {
      await deleteCategoryApi(categoryId);
      await this.bootstrap(true);
    },

    async upsertBanner(payload: BannerItem) {
      const exists = this.dataset.banners.some((item) => item.id === payload.id);
      const response = exists ? await updateBannerApi(payload.id, payload) : await createBannerApi(payload);
      const index = this.dataset.banners.findIndex((item) => item.id === response.id);

      if (index > -1) {
        this.dataset.banners.splice(index, 1, response);
      } else {
        this.dataset.banners.unshift(response);
      }
    },

    async removeBanner(bannerId: string) {
      await deleteBannerApi(bannerId);
      this.dataset.banners = this.dataset.banners.filter((item) => item.id !== bannerId);
    },

    async upsertInspiration(payload: InspirationItem) {
      const exists = this.dataset.inspirations.some((item) => item.id === payload.id);
      const response = exists ? await updateInspirationApi(payload.id, payload) : await createInspirationApi(payload);
      const index = this.dataset.inspirations.findIndex((item) => item.id === response.id);

      if (index > -1) {
        this.dataset.inspirations.splice(index, 1, response);
      } else {
        this.dataset.inspirations.unshift(response);
      }
    },

    async removeInspiration(inspirationId: string) {
      await deleteInspirationApi(inspirationId);
      this.dataset.inspirations = this.dataset.inspirations.filter((item) => item.id !== inspirationId);
    },

    async upsertArticle(payload: ArticleItem) {
      const exists = this.dataset.articles.some((item) => item.id === payload.id);
      const response = exists ? await updateArticleApi(payload.id, payload) : await createArticleApi(payload);
      const index = this.dataset.articles.findIndex((item) => item.id === response.id);

      if (index > -1) {
        this.dataset.articles.splice(index, 1, response);
      } else {
        this.dataset.articles.unshift(response);
      }
    },

    async removeArticle(articleId: string) {
      await deleteArticleApi(articleId);
      this.dataset.articles = this.dataset.articles.filter((item) => item.id !== articleId);
    },

    async upsertOrder(payload: OrderItem) {
      const exists = this.dataset.orders.some((item) => item.id === payload.id);
      const response = exists ? await updateOrderApi(payload.id, payload) : await createOrderApi(payload);
      const nextOrder = mapOrderFromApi(response);
      const index = this.dataset.orders.findIndex((item) => item.id === nextOrder.id);

      if (index > -1) {
        this.dataset.orders.splice(index, 1, nextOrder);
      } else {
        this.dataset.orders.unshift(nextOrder);
      }
    },

    async removeOrder(orderId: string) {
      await deleteOrderApi(orderId);
      this.dataset.orders = this.dataset.orders.filter((item) => item.id !== orderId);
    },
  },
});

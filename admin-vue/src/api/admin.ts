import type {
  AdminUser,
  ArticleItem,
  BannerItem,
  CategoryItem,
  InspirationItem,
  OrderItem,
  ProductItem,
} from '@/types';
import { request } from './client';

interface LoginResponse {
  token: string;
  user: AdminUser;
  expiresIn: number;
}

interface SettingsResponse {
  appName: string;
  appSlogan: string;
  headlineTitle: string;
  headlineSubtitle: string;
}

interface ProductResponse {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  rating: number;
  sales: number;
  favorites: number;
  cover: string;
  tags: string[];
  gallery: string[];
  detailContent: string[];
  deliverables: string[];
  usageNotice: string[];
  format: string;
  accent: string;
  category: string;
  authorName?: string;
  authorAvatar?: string;
  author?: {
    name: string;
    avatar?: string;
  } | null;
  isNew?: boolean;
  isHot?: boolean;
}

interface OrderResponse {
  id: string;
  customer: string;
  amount: number;
  status: string;
  items: number;
  orderCreatedAt?: string;
  createdAt?: string;
}

export function loginApi(payload: { username: string; password: string }) {
  return request<LoginResponse>('/admin/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export function getDashboardOverviewApi() {
  return request<{ products: number; categories: number; content: number; orders: number }>(
    '/admin/dashboard/overview',
  );
}

export function getSettingsApi() {
  return request<SettingsResponse | null>('/admin/settings');
}

export function updateSettingsApi(payload: SettingsResponse) {
  return request<SettingsResponse>('/admin/settings', {
    method: 'PUT',
    body: payload,
  });
}

export function getCategoriesApi() {
  return request<CategoryItem[]>('/admin/categories');
}

export function createCategoryApi(payload: CategoryItem) {
  return request<CategoryItem>('/admin/categories', {
    method: 'POST',
    body: payload,
  });
}

export function updateCategoryApi(id: string, payload: Partial<CategoryItem>) {
  return request<CategoryItem>(`/admin/categories/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteCategoryApi(id: string) {
  return request(`/admin/categories/${id}`, {
    method: 'DELETE',
  });
}

export function getProductsApi(category?: string) {
  const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
  return request<ProductResponse[]>(`/admin/products${query}`);
}

export function createProductApi(payload: ProductItem) {
  return request<ProductResponse>('/admin/products', {
    method: 'POST',
    body: toProductPayload(payload),
  });
}

export function updateProductApi(id: string, payload: ProductItem) {
  return request<ProductResponse>(`/admin/products/${id}`, {
    method: 'PUT',
    body: toProductPayload(payload),
  });
}

export function deleteProductApi(id: string) {
  return request(`/admin/products/${id}`, {
    method: 'DELETE',
  });
}

export function getBannersApi() {
  return request<BannerItem[]>('/admin/content/banners');
}

export function createBannerApi(payload: BannerItem) {
  return request<BannerItem>('/admin/content/banners', {
    method: 'POST',
    body: payload,
  });
}

export function updateBannerApi(id: string, payload: BannerItem) {
  return request<BannerItem>(`/admin/content/banners/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteBannerApi(id: string) {
  return request(`/admin/content/banners/${id}`, {
    method: 'DELETE',
  });
}

export function getInspirationsApi() {
  return request<InspirationItem[]>('/admin/content/inspirations');
}

export function createInspirationApi(payload: InspirationItem) {
  return request<InspirationItem>('/admin/content/inspirations', {
    method: 'POST',
    body: payload,
  });
}

export function updateInspirationApi(id: string, payload: InspirationItem) {
  return request<InspirationItem>(`/admin/content/inspirations/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteInspirationApi(id: string) {
  return request(`/admin/content/inspirations/${id}`, {
    method: 'DELETE',
  });
}

export function getArticlesApi() {
  return request<ArticleItem[]>('/admin/content/articles');
}

export function createArticleApi(payload: ArticleItem) {
  return request<ArticleItem>('/admin/content/articles', {
    method: 'POST',
    body: payload,
  });
}

export function updateArticleApi(id: string, payload: ArticleItem) {
  return request<ArticleItem>(`/admin/content/articles/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteArticleApi(id: string) {
  return request(`/admin/content/articles/${id}`, {
    method: 'DELETE',
  });
}

export function getOrdersApi() {
  return request<OrderResponse[]>('/admin/orders');
}

export function createOrderApi(payload: OrderItem) {
  return request<OrderResponse>('/admin/orders', {
    method: 'POST',
    body: toOrderPayload(payload),
  });
}

export function updateOrderApi(id: string, payload: OrderItem) {
  return request<OrderResponse>(`/admin/orders/${id}`, {
    method: 'PUT',
    body: toOrderPayload(payload),
  });
}

export function deleteOrderApi(id: string) {
  return request(`/admin/orders/${id}`, {
    method: 'DELETE',
  });
}

export function mapSettingsToDataset(settings: SettingsResponse | null) {
  return {
    appName: settings?.appName || '艺匠调色',
    appSlogan: settings?.appSlogan || '电影级调色资产与交付工作流库',
    headlineTitle: settings?.headlineTitle || '把风格、流程与交付一次做专业',
    headlineSubtitle: settings?.headlineSubtitle || 'LUT / PowerGrade / ACES / 商业交付模板',
  };
}

export function mapProductFromApi(product: ProductResponse): ProductItem {
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    rating: product.rating,
    sales: product.sales,
    favorites: product.favorites,
    cover: product.cover,
    tags: product.tags || [],
    gallery: product.gallery || [],
    detailContent: product.detailContent || [],
    deliverables: product.deliverables || [],
    usageNotice: product.usageNotice || [],
    format: product.format || '',
    accent: product.accent || '',
    category: product.category,
    author:
      product.author ||
      (product.authorName ? { name: product.authorName, avatar: product.authorAvatar || '' } : undefined),
    isNew: Boolean(product.isNew),
    isHot: Boolean(product.isHot),
  };
}

export function mapOrderFromApi(order: OrderResponse): OrderItem {
  return {
    id: order.id,
    customer: order.customer,
    amount: order.amount,
    status: order.status,
    items: order.items,
    createdAt: order.orderCreatedAt || order.createdAt || '',
  };
}

function toProductPayload(product: ProductItem) {
  return {
    ...product,
    author: product.author?.name
      ? {
          name: product.author.name,
          avatar: product.author.avatar || '',
        }
      : undefined,
  };
}

function toOrderPayload(order: OrderItem) {
  return {
    id: order.id,
    customer: order.customer,
    amount: order.amount,
    status: order.status,
    items: order.items,
    createdAt: order.createdAt,
    itemsDetail: null,
  };
}

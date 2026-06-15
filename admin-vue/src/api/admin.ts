import type {
  AdminUser,
  ArticleItem,
  AssetItem,
  BannerItem,
  CategoryItem,
  InspirationItem,
  OrderItem,
  ProductItem,
} from '@/types';
import { request, uploadRequest } from './client';

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
  sales: number;
  cover: string;
  tags: string[];
  gallery: string[];
  bannerImages?: string[];
  detailContent: string | string[];
  deliverables: string[];
  usageNotice: string[];
  category: string;
  isNew?: boolean;
  isHot?: boolean;
}

interface AssetResponse {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
  cover?: string;
  description?: string;
  tags: string[];
  sort?: number;
  status?: string;
}

interface AssetUploadSignatureResponse {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  authorization: string;
  contentType: string;
  expiresAt: number;
}

interface OrderResponse {
  id: string;
  userId?: string | null;
  customer: string;
  amount: number;
  status: string;
  statusName: string;
  items: number;
  itemsDetail?: OrderItem['itemsDetail'];
  orderCreatedAt?: string;
  createdAt?: string;
  nextStatuses?: Array<{ value: string; label: string }>;
  isPaid?: boolean;
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

export function getAssetsApi(type?: string) {
  const query = type && type !== 'all' ? `?type=${encodeURIComponent(type)}` : '';
  return request<AssetResponse[]>(`/admin/assets${query}`);
}

export function createAssetApi(payload: AssetItem) {
  return request<AssetResponse>('/admin/assets', {
    method: 'POST',
    body: toAssetPayload(payload),
  });
}

export function updateAssetApi(id: string, payload: AssetItem) {
  return request<AssetResponse>(`/admin/assets/${id}`, {
    method: 'PUT',
    body: toAssetPayload(payload),
  });
}

export function deleteAssetApi(id: string) {
  return request(`/admin/assets/${id}`, {
    method: 'DELETE',
  });
}

export function createAssetUploadSignatureApi(payload: {
  fileName: string;
  type: 'image' | 'video';
  mimeType?: string;
}) {
  return request<AssetUploadSignatureResponse>('/admin/assets/upload-signature', {
    method: 'POST',
    body: payload,
  });
}

export function uploadAssetFileApi(file: File) {
  return uploadRequest<AssetResponse>('/admin/assets/upload', file).then(mapAssetFromApi);
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

export function updateOrderStatusApi(id: string, status: string) {
  return request<OrderResponse>(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: { status },
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
    sales: product.sales,
    cover: product.cover,
    tags: product.tags || [],
    gallery: product.gallery || [],
    bannerImages: product.bannerImages || [],
    detailContent: normalizeDetailContentFromApi(product.detailContent),
    deliverables: product.deliverables || [],
    usageNotice: product.usageNotice || [],
    category: product.category,
    isNew: Boolean(product.isNew),
    isHot: Boolean(product.isHot),
  };
}

function normalizeDetailContentFromApi(value: string | string[] | undefined) {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => `<p>${`${item}`.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
      .join('');
  }

  return '';
}

export function mapAssetFromApi(asset: AssetResponse): AssetItem {
  return {
    id: asset.id,
    name: asset.name,
    type: asset.type,
    url: asset.url,
    cover: asset.cover || '',
    description: asset.description || '',
    tags: asset.tags || [],
    sort: asset.sort,
    status: asset.status,
  };
}

export function mapOrderFromApi(order: OrderResponse): OrderItem {
  return {
    id: order.id,
    userId: order.userId,
    customer: order.customer,
    amount: order.amount,
    status: order.status,
    statusName: order.statusName || order.status,
    items: order.items,
    createdAt: order.orderCreatedAt || order.createdAt || '',
    itemsDetail: order.itemsDetail || [],
    nextStatuses: order.nextStatuses || [],
    isPaid: order.isPaid,
  };
}

function toProductPayload(product: ProductItem) {
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    sales: product.sales,
    cover: product.cover,
    tags: product.tags || [],
    category: product.category,
    gallery: product.gallery || [],
    bannerImages: product.bannerImages || [],
    detailContent: product.detailContent || '',
    deliverables: product.deliverables || [],
    usageNotice: product.usageNotice || [],
    isNew: product.isNew,
    isHot: product.isHot,
    sort: product.sort,
    status: product.status,
  };
}

function toAssetPayload(asset: AssetItem) {
  return {
    id: asset.id,
    name: asset.name,
    type: asset.type,
    url: asset.url,
    cover: asset.cover,
    description: asset.description,
    tags: asset.tags || [],
    sort: asset.sort,
    status: asset.status,
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
    itemsDetail: order.itemsDetail,
  };
}

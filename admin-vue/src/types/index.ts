export interface ProductItem {
  id: string;
  title: string;
  description: string;
  price: number;
  sales: number;
  cover: string;
  tags: string[];
  category: string;
  gallery?: string[];
  detailContent?: string[];
  deliverables?: string[];
  usageNotice?: string[];
  isNew?: boolean;
  isHot?: boolean;
  sort?: number;
  status?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  filterKey: string;
  target: string;
  sort?: number;
  status?: string;
}

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  image: string;
  buttonText?: string;
  badge?: string;
  sort?: number;
  status?: string;
}

export interface InspirationItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  cover: string;
  sort?: number;
  status?: string;
}

export interface ArticleItem {
  id: string;
  title: string;
  cover: string;
  views: number;
  author: string;
  publishTime: string;
  sort?: number;
  status?: string;
}

export interface OrderItem {
  id: string;
  customer: string;
  amount: number;
  status: string;
  items: number;
  createdAt: string;
  itemsDetail?: unknown;
}

export interface AdminDataset {
  app: {
    name: string;
    slogan: string;
    version: string;
  };
  headline: {
    eyebrow?: string;
    title: string;
    subtitle: string;
  };
  banners: BannerItem[];
  categories: CategoryItem[];
  inspirations: InspirationItem[];
  articles: ArticleItem[];
  products: ProductItem[];
  orders: OrderItem[];
}

export interface ModuleSummaryItem {
  name: string;
  desc: string;
}

export interface AdminUser {
  username: string;
  displayName: string;
  role: string;
  avatar: string;
}

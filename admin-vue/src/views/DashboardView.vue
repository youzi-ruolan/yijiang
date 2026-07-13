<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowRight,
  Goods,
  Menu,
  Picture,
  Promotion,
  Setting,
  ShoppingCart,
} from '@element-plus/icons-vue';
import { useAdminStore } from '@/stores/admin';
import { ORDER_STATUS_NAME, ORDER_STATUS_TAG_TYPE, formatOrderAmount } from '@/constants/orders';

const router = useRouter();
const adminStore = useAdminStore();

const metrics = computed(() => {
  const { products, categories, banners, orders } = adminStore.dataset;
  return [
    {
      key: 'products',
      label: '商品',
      value: products.length,
      hint: '可售数字资产',
      path: '/products',
      tone: 'blue',
      icon: Goods,
    },
    {
      key: 'categories',
      label: '分类',
      value: categories.length,
      hint: '首页 Tab / 分类页',
      path: '/categories',
      tone: 'cyan',
      icon: Menu,
    },
    {
      key: 'banners',
      label: '首页 Banner',
      value: banners.length,
      hint: '小程序首页顶部轮播',
      path: '/content',
      tone: 'violet',
      icon: Promotion,
    },
    {
      key: 'orders',
      label: '订单',
      value: orders.length,
      hint: '近期交易记录',
      path: '/orders',
      tone: 'amber',
      icon: ShoppingCart,
    },
  ];
});

const shortcuts = [
  { label: '商品管理', desc: '封面、价格、分类、详情', path: '/products', icon: Goods },
  { label: '文件管理', desc: '上传 COS 图片 / 视频', path: '/assets', icon: Picture },
  { label: '首页 Banner', desc: '首页顶部轮播图', path: '/content', icon: Promotion },
  { label: '订单管理', desc: '付款、交付与状态', path: '/orders', icon: ShoppingCart },
  { label: '分类管理', desc: '首页分类 Tab', path: '/categories', icon: Menu },
  { label: '系统设置', desc: '品牌与首页文案', path: '/settings', icon: Setting },
];

const resourceBars = computed(() => {
  const { banners, products, assets, categories, orders } = adminStore.dataset;
  const max = Math.max(banners.length, products.length, assets.length, categories.length, orders.length, 1);
  return [
    { label: '首页 Banner', value: banners.length, max },
    { label: '商品', value: products.length, max },
    { label: '分类', value: categories.length, max },
    { label: '资源文件', value: assets.length, max },
    { label: '订单', value: orders.length, max },
  ];
});

const recentProducts = computed(() => adminStore.dataset.products.slice(0, 5));
const recentOrders = computed(() => adminStore.dataset.orders.slice(0, 6));

function go(path: string) {
  router.push(path);
}

function orderStatusLabel(status: string) {
  return ORDER_STATUS_NAME[status] || status || '未知';
}
</script>

<template>
  <div class="admin-page dashboard">
    <section class="metric-grid">
      <button
        v-for="metric in metrics"
        :key="metric.key"
        class="metric-card"
        :class="`tone-${metric.tone}`"
        type="button"
        @click="go(metric.path)"
      >
        <div class="metric-top">
          <span class="metric-label">{{ metric.label }}</span>
          <span class="metric-icon">
            <el-icon><component :is="metric.icon" /></el-icon>
          </span>
        </div>
        <div class="metric-value">{{ metric.value }}</div>
        <div class="metric-hint">{{ metric.hint }}</div>
      </button>
    </section>

    <section class="dashboard-main">
      <el-card class="admin-card panel" shadow="never">
        <template #header>
          <div class="panel-head">
            <div>
              <div class="panel-title">快捷入口</div>
              <div class="panel-desc">常用运营动作一键到达</div>
            </div>
          </div>
        </template>
        <div class="shortcut-grid">
          <button
            v-for="item in shortcuts"
            :key="item.path"
            class="shortcut-item"
            type="button"
            @click="go(item.path)"
          >
            <span class="shortcut-icon">
              <el-icon><component :is="item.icon" /></el-icon>
            </span>
            <span class="shortcut-text">
              <span class="shortcut-label">{{ item.label }}</span>
              <span class="shortcut-desc">{{ item.desc }}</span>
            </span>
            <el-icon class="shortcut-arrow"><ArrowRight /></el-icon>
          </button>
        </div>
      </el-card>

      <el-card class="admin-card panel" shadow="never">
        <template #header>
          <div class="panel-head">
            <div>
              <div class="panel-title">资源分布</div>
              <div class="panel-desc">当前库内运营资源数量</div>
            </div>
          </div>
        </template>
        <div class="resource-bars">
          <div v-for="item in resourceBars" :key="item.label" class="resource-row">
            <div class="resource-meta">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
            <div class="resource-track">
              <div class="resource-fill" :style="{ width: `${Math.max((item.value / item.max) * 100, item.value ? 8 : 0)}%` }" />
            </div>
          </div>
        </div>
      </el-card>
    </section>

    <section class="dashboard-lists">
      <el-card class="admin-card panel" shadow="never">
        <template #header>
          <div class="panel-head">
            <div>
              <div class="panel-title">最近商品</div>
              <div class="panel-desc">按当前列表顺序展示前 5 条</div>
            </div>
            <el-button text type="primary" @click="go('/products')">全部商品</el-button>
          </div>
        </template>

        <div v-if="!recentProducts.length" class="admin-empty">暂无商品，先去「商品管理」创建</div>
        <div v-else class="list-stack">
          <button
            v-for="product in recentProducts"
            :key="product.id"
            class="list-row product-row"
            type="button"
            @click="go('/products')"
          >
            <img :src="product.cover" :alt="product.title" class="admin-thumb" />
            <div class="list-main">
              <div class="list-title">{{ product.title }}</div>
              <div class="list-sub">{{ product.category || '未分类' }} · ¥{{ product.price }}</div>
            </div>
            <el-tag size="small" effect="plain">销量 {{ product.sales || 0 }}</el-tag>
          </button>
        </div>
      </el-card>

      <el-card class="admin-card panel" shadow="never">
        <template #header>
          <div class="panel-head">
            <div>
              <div class="panel-title">最近订单</div>
              <div class="panel-desc">最新 6 笔交易状态</div>
            </div>
            <el-button text type="primary" @click="go('/orders')">全部订单</el-button>
          </div>
        </template>

        <div v-if="!recentOrders.length" class="admin-empty">暂无订单</div>
        <div v-else class="list-stack">
          <button
            v-for="order in recentOrders"
            :key="order.id"
            class="list-row order-row"
            type="button"
            @click="go('/orders')"
          >
            <div class="list-main">
              <div class="list-title">{{ order.customer || order.id }}</div>
              <div class="list-sub">{{ order.id }} · {{ order.createdAt || '-' }}</div>
            </div>
            <div class="order-side">
              <strong>{{ formatOrderAmount(order.amount || 0) }}</strong>
              <el-tag size="small" :type="ORDER_STATUS_TAG_TYPE[order.status] || 'info'" effect="light">
                {{ order.statusName || orderStatusLabel(order.status) }}
              </el-tag>
            </div>
          </button>
        </div>
      </el-card>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  gap: 18px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  appearance: none;
  border: 1px solid var(--admin-line);
  border-radius: 14px;
  background: #fff;
  padding: 18px 18px 16px;
  text-align: left;
  cursor: pointer;
  box-shadow: var(--admin-shadow-soft);
  position: relative;
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.metric-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--tone);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--admin-shadow);
  border-color: color-mix(in srgb, var(--tone) 35%, var(--admin-line));
}

.tone-blue {
  --tone: #1890ff;
  --tone-soft: #e6f4ff;
}

.tone-cyan {
  --tone: #13c2c2;
  --tone-soft: #e6fffb;
}

.tone-violet {
  --tone: #722ed1;
  --tone-soft: #f9f0ff;
}

.tone-amber {
  --tone: #fa8c16;
  --tone-soft: #fff7e6;
}

.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.metric-label {
  font-size: 13px;
  color: var(--admin-text-soft);
  font-weight: 500;
}

.metric-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--tone-soft);
  color: var(--tone);
  font-size: 16px;
}

.metric-value {
  margin-top: 14px;
  font-size: 32px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--admin-text);
}

.metric-hint {
  margin-top: 10px;
  font-size: 12px;
  color: var(--admin-text-soft);
  line-height: 1.4;
}

.dashboard-main,
.dashboard-lists {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 14px;
}

.panel :deep(.el-card__header) {
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--admin-line);
}

.panel :deep(.el-card__body) {
  padding: 14px 18px 18px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel-title {
  font-size: 15px;
  font-weight: 650;
  color: var(--admin-text);
}

.panel-desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--admin-text-soft);
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.shortcut-item {
  appearance: none;
  border: 1px solid var(--admin-line);
  background: #fbfcfe;
  border-radius: 12px;
  padding: 12px;
  display: grid;
  grid-template-columns: 36px 1fr 16px;
  gap: 10px;
  align-items: center;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.shortcut-item:hover {
  background: var(--admin-primary-soft);
  border-color: var(--admin-primary-line);
}

.shortcut-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #fff;
  color: var(--admin-primary);
  border: 1px solid var(--admin-line);
}

.shortcut-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.shortcut-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--admin-text);
}

.shortcut-desc {
  font-size: 12px;
  color: var(--admin-text-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shortcut-arrow {
  color: #9aa8b8;
}

.resource-bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.resource-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.resource-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--admin-text-soft);
}

.resource-meta strong {
  color: var(--admin-text);
  font-size: 15px;
}

.resource-track {
  height: 8px;
  border-radius: 999px;
  background: #eef3f8;
  overflow: hidden;
}

.resource-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #69b1ff, #1890ff);
}

.list-stack {
  display: flex;
  flex-direction: column;
}

.list-row {
  appearance: none;
  width: 100%;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--admin-line);
  cursor: pointer;
  text-align: left;
}

.list-row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.list-row:first-child {
  padding-top: 2px;
}

.list-row:hover .list-title {
  color: var(--admin-primary);
}

.list-main {
  min-width: 0;
  flex: 1;
}

.list-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--admin-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--admin-text-soft);
}

.order-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.order-side strong {
  font-size: 14px;
  color: var(--admin-text);
}

@media (max-width: 1180px) {
  .metric-grid,
  .dashboard-main,
  .dashboard-lists,
  .shortcut-grid {
    grid-template-columns: 1fr;
  }
}
</style>

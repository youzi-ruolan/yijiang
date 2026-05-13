<script setup lang="ts">
import { computed } from 'vue';
import { useAdminStore } from '@/stores/admin';
import { MODULE_SUMMARIES } from '@/constants/modules';

const adminStore = useAdminStore();

const metrics = computed(() => [
  { label: '商品总数', value: adminStore.dataset.products.length },
  { label: '首页分类', value: adminStore.dataset.categories.length },
  { label: '运营内容', value: adminStore.dataset.inspirations.length + adminStore.dataset.articles.length },
  { label: '最近订单', value: adminStore.dataset.orders.length },
]);

const resources = computed(() => [
  { label: 'Banner 位', value: adminStore.dataset.banners.length },
  { label: '灵感卡片', value: adminStore.dataset.inspirations.length },
  { label: '文章课程', value: adminStore.dataset.articles.length },
  { label: '首页商品', value: adminStore.dataset.products.length },
]);
</script>

<template>
  <div class="admin-page">
    <div class="admin-grid-4">
      <t-card v-for="metric in metrics" :key="metric.label" class="admin-card metric-card">
        <div class="metric-label">{{ metric.label }}</div>
        <div class="metric-value">{{ metric.value }}</div>
      </t-card>
    </div>

    <div class="admin-grid-2">
      <t-card class="admin-card">
        <div class="panel-title">功能模块</div>
        <div class="module-list">
          <div v-for="module in MODULE_SUMMARIES" :key="module.name" class="module-item">
            <div class="module-row">
              <div class="module-title">{{ module.name }}</div>
              <div class="module-desc">{{ module.desc }}</div>
            </div>
          </div>
        </div>
      </t-card>

      <t-card class="admin-card">
        <div class="panel-title">运营资源</div>
        <div class="resource-list">
          <div v-for="resource in resources" :key="resource.label" class="resource-item">
            <div class="module-title">{{ resource.label }}</div>
            <div class="resource-value">{{ resource.value }}</div>
          </div>
        </div>
      </t-card>
    </div>
  </div>
</template>

<style scoped>
.metric-card :deep(.t-card__body) {
  padding: 22px;
}

.metric-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 248, 243, 0.92) 100%);
}

.metric-label {
  color: var(--admin-text-soft);
  font-size: 13px;
}

.metric-value {
  margin-top: 14px;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.module-list,
.resource-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel-title {
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 700;
}

.module-item,
.resource-item {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(239, 228, 218, 0.72);
}

.module-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 16px;
  align-items: start;
}

.module-title {
  font-weight: 700;
}

.module-desc {
  margin-top: 8px;
  color: var(--admin-text-soft);
  font-size: 13px;
  line-height: 1.7;
}

.resource-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

.resource-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--admin-primary);
}

@media (max-width: 640px) {
  .module-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>

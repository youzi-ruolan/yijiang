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
      <el-card v-for="metric in metrics" :key="metric.label" class="admin-card metric-card" shadow="never">
        <div class="metric-label">{{ metric.label }}</div>
        <div class="metric-value">{{ metric.value }}</div>
      </el-card>
    </div>

    <div class="admin-grid-2">
      <el-card class="admin-card" shadow="never">
        <template #header>
          <span class="panel-title">功能模块</span>
        </template>
        <div class="module-list">
          <div v-for="module in MODULE_SUMMARIES" :key="module.name" class="module-item">
            <div class="module-title">{{ module.name }}</div>
            <div class="module-desc">{{ module.desc }}</div>
          </div>
        </div>
      </el-card>

      <el-card class="admin-card" shadow="never">
        <template #header>
          <span class="panel-title">运营资源</span>
        </template>
        <div class="resource-list">
          <div v-for="resource in resources" :key="resource.label" class="resource-item">
            <span class="module-title">{{ resource.label }}</span>
            <span class="resource-value">{{ resource.value }}</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.metric-card :deep(.el-card__body) {
  padding: 20px;
}

.metric-label {
  color: var(--admin-text-soft);
  font-size: 13px;
}

.metric-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 600;
  color: var(--admin-primary);
}

.module-list,
.resource-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
}

.module-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--admin-line);
}

.module-item:last-child {
  border-bottom: none;
}

.module-title {
  font-weight: 500;
  font-size: 14px;
}

.module-desc {
  margin-top: 4px;
  color: var(--admin-text-soft);
  font-size: 13px;
  line-height: 1.6;
}

.resource-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--admin-line);
}

.resource-item:last-child {
  border-bottom: none;
}

.resource-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--admin-primary);
}
</style>

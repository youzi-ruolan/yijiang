<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import { useAdminStore } from '@/stores/admin';
import {
  formatOrderAmount,
  ORDER_STATUS,
  ORDER_STATUS_FILTER_OPTIONS,
  ORDER_STATUS_TAG_TYPE,
} from '@/constants/orders';
import type { OrderItem } from '@/types';

const adminStore = useAdminStore();
const statusFilter = ref('all');
const detailVisible = ref(false);
const activeOrder = ref<OrderItem | null>(null);
const refreshing = ref(false);

const filteredOrders = computed(() => {
  if (statusFilter.value === 'all') {
    return adminStore.dataset.orders;
  }
  return adminStore.dataset.orders.filter((item) => item.status === statusFilter.value);
});

const stats = computed(() => {
  const orders = adminStore.dataset.orders;
  const paidOrders = orders.filter((item) => item.isPaid);
  const total = paidOrders.reduce((sum, item) => sum + item.amount, 0) / 100;
  const pendingDelivery = orders.filter((item) => item.status === ORDER_STATUS.PENDING_DELIVERY).length;
  const finished = orders.filter((item) => item.status === ORDER_STATUS.COMPLETE).length;

  return [
    { label: '订单总数', value: orders.length },
    { label: '待交付', value: pendingDelivery },
    { label: '已完成', value: finished },
    { label: '累计成交额', value: `¥${total.toFixed(2)}` },
    {
      label: '平均客单价',
      value: `¥${(total / Math.max(paidOrders.length, 1)).toFixed(2)}`,
    },
    {
      label: '商品件数',
      value: orders.reduce((sum, item) => sum + item.items, 0),
    },
  ];
});

async function refreshOrders() {
  refreshing.value = true;
  try {
    await adminStore.bootstrap(true);
    ElMessage.success('订单数据已刷新');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '订单刷新失败');
  } finally {
    refreshing.value = false;
  }
}

function openDetail(order: OrderItem) {
  activeOrder.value = order;
  detailVisible.value = true;
}

async function updateStatus(order: OrderItem, status: string) {
  try {
    await adminStore.updateOrderStatus(order.id, status);
    if (activeOrder.value?.id === order.id) {
      activeOrder.value = adminStore.dataset.orders.find((item) => item.id === order.id) || null;
    }
    ElMessage.success('订单状态已更新');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '订单状态更新失败');
  }
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-grid-3">
      <el-card v-for="item in stats" :key="item.label" class="admin-card order-stat-card" shadow="never">
        <div class="stat-label">{{ item.label }}</div>
        <div class="stat-value">{{ item.value }}</div>
      </el-card>
    </div>

    <div class="page-toolbar">
      <div class="toolbar-pills">
        <span class="toolbar-chip">小程序真实订单 {{ adminStore.dataset.orders.length }} 条</span>
        <el-radio-group v-model="statusFilter" size="small">
          <el-radio-button v-for="option in ORDER_STATUS_FILTER_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </el-radio-button>
        </el-radio-group>
      </div>
      <el-button :icon="Refresh" :loading="refreshing" @click="refreshOrders">刷新订单</el-button>
    </div>

    <el-card class="admin-card" shadow="never">
      <div class="order-table__head data-table-head">
        <span>订单信息</span>
        <span>金额 / 件数</span>
        <span>状态</span>
        <span>操作</span>
      </div>
      <div class="order-list">
        <div v-for="order in filteredOrders" :key="order.id" class="order-item data-table-row">
          <div>
            <div class="order-title">{{ order.id }}</div>
            <div class="order-meta">
              {{ order.customer }}
              <span v-if="order.userId"> · 用户 {{ order.userId.slice(0, 8) }}...</span>
              · {{ order.createdAt }}
            </div>
          </div>
          <div class="order-right">
            <div class="order-amount">{{ formatOrderAmount(order.amount) }}</div>
            <div class="order-count">{{ order.items }} 件商品</div>
          </div>
          <div>
            <el-tag :type="ORDER_STATUS_TAG_TYPE[order.status] || 'info'" size="small">
              {{ order.statusName }}
            </el-tag>
          </div>
          <div class="order-actions">
            <el-button link type="primary" @click="openDetail(order)">查看详情</el-button>
            <el-button
              v-for="next in order.nextStatuses"
              :key="next.value"
              link
              type="primary"
              @click="updateStatus(order, next.value)"
            >
              {{ next.label }}
            </el-button>
          </div>
        </div>
        <div v-if="!filteredOrders.length" class="admin-empty">
          {{ statusFilter === 'all' ? '暂无订单，用户下单后会自动出现在这里。' : '当前筛选条件下暂无订单。' }}
        </div>
      </div>
    </el-card>

    <el-drawer v-model="detailVisible" title="订单详情" size="520px" destroy-on-close>
      <template v-if="activeOrder">
        <div class="detail-section">
          <div class="detail-row">
            <span>订单号</span>
            <strong>{{ activeOrder.id }}</strong>
          </div>
          <div class="detail-row">
            <span>客户</span>
            <strong>{{ activeOrder.customer }}</strong>
          </div>
          <div v-if="activeOrder.userId" class="detail-row">
            <span>用户 ID</span>
            <strong>{{ activeOrder.userId }}</strong>
          </div>
          <div class="detail-row">
            <span>下单时间</span>
            <strong>{{ activeOrder.createdAt }}</strong>
          </div>
          <div class="detail-row">
            <span>订单状态</span>
            <el-tag :type="ORDER_STATUS_TAG_TYPE[activeOrder.status] || 'info'" size="small">
              {{ activeOrder.statusName }}
            </el-tag>
          </div>
          <div class="detail-row">
            <span>订单金额</span>
            <strong>{{ formatOrderAmount(activeOrder.amount) }}</strong>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section__title">商品明细</div>
          <div v-if="activeOrder.itemsDetail?.length" class="order-goods">
            <div v-for="(item, index) in activeOrder.itemsDetail" :key="`${item.skuId}-${index}`" class="order-goods__item">
              <el-image
                v-if="item.goodsPictureUrl"
                :src="item.goodsPictureUrl"
                fit="cover"
                class="order-goods__thumb"
              />
              <div v-else class="order-goods__thumb order-goods__thumb--empty">无图</div>
              <div class="order-goods__info">
                <div class="order-goods__name">{{ item.goodsName }}</div>
                <div class="order-goods__meta">
                  数量 {{ item.buyQuantity }} · {{ formatOrderAmount(item.actualPrice) }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="admin-empty">暂无商品明细。</div>
        </div>

        <div v-if="activeOrder.nextStatuses?.length" class="detail-actions">
          <el-button
            v-for="next in activeOrder.nextStatuses"
            :key="next.value"
            type="primary"
            @click="updateStatus(activeOrder, next.value)"
          >
            标记为「{{ next.label }}」
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.order-stat-card :deep(.el-card__body) {
  padding: 16px 20px;
}

.stat-label {
  color: var(--admin-text-soft);
  font-size: 13px;
}

.stat-value {
  margin-top: 6px;
  font-size: 24px;
  font-weight: 600;
  color: var(--admin-primary);
}

.toolbar-pills {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.order-table__head,
.order-item {
  grid-template-columns: minmax(220px, 2fr) minmax(120px, 0.9fr) 100px minmax(140px, 1fr);
}

.order-list {
  display: flex;
  flex-direction: column;
}

.order-title {
  font-weight: 500;
  font-size: 14px;
}

.order-meta {
  margin-top: 4px;
  color: var(--admin-text-soft);
  font-size: 13px;
}

.order-amount {
  font-weight: 600;
  color: var(--admin-primary);
}

.order-count {
  margin-top: 2px;
  color: var(--admin-text-soft);
  font-size: 12px;
}

.order-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section__title {
  margin-bottom: 12px;
  font-weight: 600;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--admin-line);
  font-size: 14px;
}

.detail-row span {
  color: var(--admin-text-soft);
}

.order-goods {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-goods__item {
  display: flex;
  gap: 12px;
  align-items: center;
}

.order-goods__thumb {
  width: 56px;
  height: 56px;
  border-radius: var(--admin-radius-sm);
  border: 1px solid var(--admin-line);
  flex-shrink: 0;
}

.order-goods__thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--admin-text-soft);
  font-size: 12px;
  background: var(--admin-bg);
}

.order-goods__name {
  font-weight: 500;
}

.order-goods__meta {
  margin-top: 4px;
  color: var(--admin-text-soft);
  font-size: 13px;
}

.detail-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 920px) {
  .order-table__head {
    display: none;
  }

  .order-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { useAdminStore } from '@/stores/admin';
import type { OrderItem } from '@/types';

const adminStore = useAdminStore();
const dialogVisible = ref(false);
const editingId = ref('');

const form = reactive({
  customer: '',
  amount: 0,
  status: '待处理',
  items: 1,
  createdAt: '',
});

const statusOptions = [
  { label: '待处理', value: '待处理' },
  { label: '已付款', value: '已付款' },
  { label: '待交付', value: '待交付' },
  { label: '已完成', value: '已完成' },
  { label: '已取消', value: '已取消' },
];

const statusThemeMap: Record<string, string> = {
  待处理: 'warning',
  已付款: 'primary',
  待交付: 'warning',
  已完成: 'success',
  已取消: 'danger',
};

const stats = computed(() => {
  const total = adminStore.dataset.orders.reduce((sum, item) => sum + item.amount, 0) / 100;
  const pending = adminStore.dataset.orders.filter((item) => ['待处理', '待交付'].includes(item.status)).length;
  const finished = adminStore.dataset.orders.filter((item) => item.status === '已完成').length;

  return [
    { label: '订单总数', value: adminStore.dataset.orders.length },
    { label: '待处理订单', value: pending },
    { label: '已完成订单', value: finished },
    { label: '累计成交额', value: `¥${total.toFixed(2)}` },
    {
      label: '平均客单价',
      value: `¥${(total / Math.max(adminStore.dataset.orders.length, 1)).toFixed(2)}`,
    },
    {
      label: '商品件数',
      value: adminStore.dataset.orders.reduce((sum, item) => sum + item.items, 0),
    },
  ];
});

function resetForm() {
  form.customer = '';
  form.amount = 0;
  form.status = '待处理';
  form.items = 1;
  form.createdAt = '';
}

function openCreate() {
  editingId.value = '';
  resetForm();
  dialogVisible.value = true;
}

function openEdit(order: OrderItem) {
  editingId.value = order.id;
  form.customer = order.customer;
  form.amount = order.amount / 100;
  form.status = order.status;
  form.items = order.items;
  form.createdAt = order.createdAt;
  dialogVisible.value = true;
}

async function saveOrder() {
  if (!form.customer.trim() || !form.createdAt.trim()) {
    MessagePlugin.warning('请先填写客户名称和下单时间');
    return;
  }

  try {
    await adminStore.upsertOrder({
      id: editingId.value || `order_${Date.now()}`,
      customer: form.customer.trim(),
      amount: Math.round(Number(form.amount) * 100),
      status: form.status,
      items: Number(form.items),
      createdAt: form.createdAt.trim(),
    });

    dialogVisible.value = false;
    MessagePlugin.success(editingId.value ? '订单已更新' : '订单已新增');
  } catch (error) {
    MessagePlugin.error(error instanceof Error ? error.message : '订单保存失败');
  }
}

function removeOrder(order: OrderItem) {
  const dialog = DialogPlugin({
    header: '确认删除订单？',
    body: `确认删除订单「${order.id}」吗？`,
    confirmBtn: '删除',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        await adminStore.removeOrder(order.id);
        MessagePlugin.success('订单已删除');
      } catch (error) {
        MessagePlugin.error(error instanceof Error ? error.message : '订单删除失败');
      }
      dialog.hide();
    },
    onClose: () => dialog.hide(),
  });
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-grid-3">
      <t-card v-for="item in stats" :key="item.label" class="admin-card order-stat-card">
        <div class="stat-label">{{ item.label }}</div>
        <div class="stat-value">{{ item.value }}</div>
      </t-card>
    </div>

    <div class="page-toolbar">
      <div class="toolbar-pills">
        <span class="toolbar-chip">最近订单 {{ adminStore.dataset.orders.length }} 条</span>
      </div>
      <t-button theme="primary" @click="openCreate">新增订单</t-button>
    </div>

    <t-card class="admin-card order-table-card">
      <div class="order-table__head">
        <span>订单信息</span>
        <span>金额 / 件数</span>
        <span>状态</span>
        <span>操作</span>
      </div>
      <div class="order-list">
        <div v-for="order in adminStore.dataset.orders" :key="order.id" class="order-item">
          <div>
            <div class="order-title">{{ order.id }}</div>
            <div class="order-meta">{{ order.customer }} · {{ order.createdAt }}</div>
          </div>
          <div class="order-right order-right--summary">
            <div class="order-amount">¥{{ (order.amount / 100).toFixed(2) }}</div>
            <div class="order-count">{{ order.items }} 件商品</div>
          </div>
          <div>
            <span class="admin-chip" :class="`status-chip status-chip--${statusThemeMap[order.status] || 'default'}`">
              {{ order.status }}
            </span>
          </div>
          <div class="order-actions">
            <t-link theme="primary" hover="color" @click="openEdit(order)">编辑</t-link>
            <t-link theme="danger" hover="color" @click="removeOrder(order)">删除</t-link>
          </div>
        </div>
      </div>
    </t-card>

    <t-dialog
      v-model:visible="dialogVisible"
      :header="editingId ? '编辑订单' : '新增订单'"
      width="700px"
      confirm-btn="保存"
      cancel-btn="取消"
      @confirm="saveOrder"
    >
      <div class="form-grid">
        <div class="field">
          <span>客户名称</span>
          <t-input v-model="form.customer" placeholder="请输入客户名称" />
        </div>
        <div class="field">
          <span>订单状态</span>
          <t-select v-model="form.status" :options="statusOptions" />
        </div>
        <div class="field">
          <span>订单金额（元）</span>
          <t-input-number v-model="form.amount" theme="normal" :min="0" />
        </div>
        <div class="field">
          <span>商品件数</span>
          <t-input-number v-model="form.items" theme="normal" :min="1" />
        </div>
        <div class="field field-full">
          <span>下单时间</span>
          <t-input v-model="form.createdAt" placeholder="如：2026-05-13 18:20" />
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<style scoped>
.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-pills {
  margin-right: auto;
  display: flex;
}

.toolbar-chip {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(239, 228, 218, 0.82);
  color: var(--admin-text-soft);
  font-size: 12px;
}

.order-stat-card :deep(.t-card__body) {
  padding: 20px;
}

.stat-label {
  color: var(--admin-text-soft);
  font-size: 13px;
}

.stat-value {
  margin-top: 12px;
  font-size: 28px;
  font-weight: 700;
}

.order-table-card :deep(.t-card__body) {
  padding: 10px 12px 12px;
}

.order-table__head {
  display: grid;
  grid-template-columns: minmax(260px, 2fr) minmax(140px, 0.9fr) 120px 120px;
  gap: 16px;
  align-items: center;
  padding: 0 16px 12px;
  color: var(--admin-text-soft);
  font-size: 12px;
  font-weight: 600;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.order-item {
  display: grid;
  grid-template-columns: minmax(260px, 2fr) minmax(140px, 0.9fr) 120px 120px;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(239, 228, 218, 0.72);
}

.order-title,
.order-amount {
  font-weight: 700;
}

.order-meta {
  margin-top: 8px;
  color: var(--admin-text-soft);
  font-size: 13px;
}

.order-count {
  margin-top: 6px;
  color: var(--admin-text-soft);
  font-size: 12px;
}

.order-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.order-right--summary {
  align-items: flex-start;
  gap: 2px;
}

.order-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.status-chip--warning {
  color: #d97706;
  background: rgba(255, 247, 237, 0.96);
  border-color: rgba(245, 158, 11, 0.18);
}

.status-chip--success {
  color: #16a34a;
  background: rgba(240, 253, 244, 0.96);
  border-color: rgba(34, 197, 94, 0.16);
}

.status-chip--primary {
  color: #2563eb;
  background: rgba(239, 246, 255, 0.96);
  border-color: rgba(96, 165, 250, 0.2);
}

.status-chip--danger {
  color: #dc2626;
  background: rgba(254, 242, 242, 0.96);
  border-color: rgba(239, 68, 68, 0.16);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field span {
  color: var(--admin-text-soft);
  font-size: 13px;
}

.field-full {
  grid-column: 1 / -1;
}

@media (max-width: 920px) {
  .order-table__head {
    display: none;
  }

  .order-item {
    grid-template-columns: 1fr;
  }

  .order-right,
  .order-right--summary,
  .order-actions {
    align-items: flex-start;
  }
}
</style>

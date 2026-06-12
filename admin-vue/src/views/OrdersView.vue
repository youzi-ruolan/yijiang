<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
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

const statusTypeMap: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
  待处理: 'warning',
  已付款: '',
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
    ElMessage.warning('请先填写客户名称和下单时间');
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
    ElMessage.success(editingId.value ? '订单已更新' : '订单已新增');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '订单保存失败');
  }
}

async function removeOrder(order: OrderItem) {
  try {
    await ElMessageBox.confirm(`确认删除订单「${order.id}」吗？`, '确认删除订单？', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await adminStore.removeOrder(order.id);
    ElMessage.success('订单已删除');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error instanceof Error ? error.message : '订单删除失败');
    }
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
        <span class="toolbar-chip">最近订单 {{ adminStore.dataset.orders.length }} 条</span>
      </div>
      <el-button type="primary" @click="openCreate">新增订单</el-button>
    </div>

    <el-card class="admin-card" shadow="never">
      <div class="order-table__head data-table-head">
        <span>订单信息</span>
        <span>金额 / 件数</span>
        <span>状态</span>
        <span>操作</span>
      </div>
      <div class="order-list">
        <div v-for="order in adminStore.dataset.orders" :key="order.id" class="order-item data-table-row">
          <div>
            <div class="order-title">{{ order.id }}</div>
            <div class="order-meta">{{ order.customer }} · {{ order.createdAt }}</div>
          </div>
          <div class="order-right">
            <div class="order-amount">¥{{ (order.amount / 100).toFixed(2) }}</div>
            <div class="order-count">{{ order.items }} 件商品</div>
          </div>
          <div>
            <el-tag :type="statusTypeMap[order.status] || 'info'" size="small">{{ order.status }}</el-tag>
          </div>
          <div class="order-actions">
            <el-button link type="primary" @click="openEdit(order)">编辑</el-button>
            <el-button link type="danger" @click="removeOrder(order)">删除</el-button>
          </div>
        </div>
        <div v-if="!adminStore.dataset.orders.length" class="admin-empty">暂无订单数据。</div>
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑订单' : '新增订单'"
      width="640px"
      destroy-on-close
    >
      <div class="form-grid">
        <div class="field">
          <span>客户名称</span>
          <el-input v-model="form.customer" placeholder="请输入客户名称" />
        </div>
        <div class="field">
          <span>订单状态</span>
          <el-select v-model="form.status" style="width: 100%">
            <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
        <div class="field">
          <span>订单金额（元）</span>
          <el-input-number v-model="form.amount" :min="0" controls-position="right" style="width: 100%" />
        </div>
        <div class="field">
          <span>商品件数</span>
          <el-input-number v-model="form.items" :min="1" controls-position="right" style="width: 100%" />
        </div>
        <div class="field field-full">
          <span>下单时间</span>
          <el-input v-model="form.createdAt" placeholder="如：2026-05-13 18:20" />
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveOrder">保存</el-button>
      </template>
    </el-dialog>
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

.order-table__head,
.order-item {
  grid-template-columns: minmax(220px, 2fr) minmax(120px, 0.9fr) 100px 120px;
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

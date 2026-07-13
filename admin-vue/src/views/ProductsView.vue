<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ProductFormDialog from '@/components/ProductFormDialog.vue';
import { useAdminStore } from '@/stores/admin';
import type { ProductItem } from '@/types';

function formatPriceYuan(price: number) {
  return Number(price).toFixed(2).replace(/\.?0+$/, '').replace(/\.$/, '') || '0';
}

const adminStore = useAdminStore();

const categoryFilter = ref('all');
const dialogVisible = ref(false);
const editingProduct = ref<ProductItem | null>(null);

const categoryOptions = computed(() =>
  adminStore.productCategories.map((item) => ({
    label: item.name,
    value: item.filterKey,
  })),
);

const products = computed(() =>
  categoryFilter.value === 'all'
    ? adminStore.dataset.products
    : adminStore.dataset.products.filter((item) => item.category === categoryFilter.value),
);

const categoryNameMap = computed(() =>
  Object.fromEntries(adminStore.productCategories.map((item) => [item.filterKey, item.name])),
);

function openCreate() {
  editingProduct.value = null;
  dialogVisible.value = true;
}

function openEdit(product: ProductItem) {
  editingProduct.value = product;
  dialogVisible.value = true;
}

async function handleSaved(product: ProductItem, isEdit: boolean) {
  try {
    await adminStore.upsertProduct(product);
    dialogVisible.value = false;
    editingProduct.value = null;
    ElMessage.success(isEdit ? '商品已更新' : '商品已新增');
  } catch (error) {
    const message = error instanceof Error ? error.message : '商品保存失败';
    if (message.includes('bannerImages') || message.includes('detailContent must be an array')) {
      ElMessage.error('服务端版本过旧：请部署最新 server 代码并执行 prisma migrate deploy 后再保存');
      return;
    }
    ElMessage.error(message);
  }
}

function handleValidateError(message: string) {
  ElMessage.warning(message);
}

async function removeProduct(product: ProductItem) {
  try {
    await ElMessageBox.confirm(`确认删除「${product.title}」吗？`, '确认删除商品？', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await adminStore.removeProduct(product.id);
    ElMessage.success('商品已删除');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error instanceof Error ? error.message : '商品删除失败');
    }
  }
}
</script>

<template>
  <div class="admin-page">
    <div class="page-toolbar">
      <div class="toolbar-pills">
        <span class="toolbar-chip">共 {{ products.length }} 个商品</span>
        <span v-if="adminStore.dataset.assets.length" class="toolbar-chip">
          资源库 {{ adminStore.dataset.assets.length }} 个文件可用
        </span>
      </div>
      <el-select v-model="categoryFilter" class="toolbar-select" placeholder="全部分类">
        <el-option label="全部分类" value="all" />
        <el-option v-for="opt in categoryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-button type="primary" @click="openCreate">新增商品</el-button>
    </div>

    <el-card class="admin-card table-card" shadow="never">
      <el-table :data="products" row-key="id" stripe style="width: 100%">
        <el-table-column label="封面" width="80">
          <template #default="{ row }">
            <img :src="row.cover" :alt="row.title" class="admin-thumb" />
          </template>
        </el-table-column>
        <el-table-column label="名称" min-width="240">
          <template #default="{ row }">
            <div class="table-title">{{ row.title }}</div>
            <div class="table-desc">{{ row.description }}</div>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <span class="admin-chip">{{ categoryNameMap[row.category] || row.category }}</span>
          </template>
        </el-table-column>
        <el-table-column label="轮播" width="80">
          <template #default="{ row }">
            <span class="gallery-count">{{ (row.bannerImages || []).length || (row.gallery || []).length }} 张</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <span class="admin-chip">{{ row.isVirtual ? '虚拟' : '实物' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="100">
          <template #default="{ row }">
            <span class="price-current">¥{{ formatPriceYuan(row.price) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="140">
          <template #default="{ row }">
            <div class="admin-tag-list">
              <span v-for="tag in row.tags" :key="tag" class="admin-chip">{{ tag }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="removeProduct(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <ProductFormDialog
      v-model="dialogVisible"
      :product="editingProduct"
      @saved="handleSaved"
      @validate-error="handleValidateError"
    />
  </div>
</template>

<style scoped>
.table-card :deep(.el-card__body) {
  padding: 0;
}

.table-title {
  font-weight: 500;
  font-size: 14px;
}

.table-desc {
  margin-top: 4px;
  color: var(--admin-text-soft);
  font-size: 12px;
  line-height: 1.5;
}

.price-current {
  font-weight: 600;
  color: var(--admin-primary);
}

.gallery-count {
  font-size: 13px;
  color: var(--admin-text-soft);
}
</style>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { useAdminStore } from '@/stores/admin';
import type { ProductItem } from '@/types';

const adminStore = useAdminStore();

const categoryFilter = ref('all');
const dialogVisible = ref(false);
const editingId = ref('');

const form = reactive({
  title: '',
  description: '',
  price: 0,
  category: '',
  sales: 0,
  cover: '',
  tags: '',
  gallery: '',
  detailContent: '',
  deliverables: '',
  usageNotice: '',
});

const categoryOptions = computed(() =>
  adminStore.productCategories.map((item) => ({
    label: item.name,
    value: item.filterKey,
  })),
);

const filterOptions = computed(() => [{ label: '全部分类', value: 'all' }, ...categoryOptions.value]);

const products = computed(() =>
  categoryFilter.value === 'all'
    ? adminStore.dataset.products
    : adminStore.dataset.products.filter((item) => item.category === categoryFilter.value),
);

const columns = [
  { colKey: 'cover', title: '封面', width: 90 },
  { colKey: 'title', title: '名称', width: 280 },
  { colKey: 'category', title: '分类', width: 120 },
  { colKey: 'price', title: '价格', width: 120 },
  { colKey: 'tags', title: '标签' },
  { colKey: 'actions', title: '操作', width: 150 },
];

const categoryNameMap = computed(() =>
  Object.fromEntries(adminStore.productCategories.map((item) => [item.filterKey, item.name])),
);

function resetForm() {
  form.title = '';
  form.description = '';
  form.price = 0;
  form.category = '';
  form.sales = 0;
  form.cover = '';
  form.tags = '';
  form.gallery = '';
  form.detailContent = '';
  form.deliverables = '';
  form.usageNotice = '';
}

function openCreate() {
  editingId.value = '';
  resetForm();
  dialogVisible.value = true;
}

function openEdit(product: ProductItem) {
  editingId.value = product.id;
  form.title = product.title;
  form.description = product.description;
  form.price = product.price;
  form.category = product.category;
  form.sales = product.sales;
  form.cover = product.cover;
  form.tags = (product.tags || []).join(', ');
  form.gallery = (product.gallery || []).join('\n');
  form.detailContent = (product.detailContent || []).join('\n');
  form.deliverables = (product.deliverables || []).join('\n');
  form.usageNotice = (product.usageNotice || []).join('\n');
  dialogVisible.value = true;
}

async function saveProduct() {
  if (!form.category || form.category === 'all') {
    MessagePlugin.warning('请选择商品分类');
    return;
  }

  const product: ProductItem = {
    id: editingId.value || `product_${Date.now()}`,
    title: form.title.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    sales: Number(form.sales),
    cover: form.cover.trim(),
    tags: form.tags
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    category: form.category,
    gallery: form.gallery
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    detailContent: form.detailContent
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    deliverables: form.deliverables
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    usageNotice: form.usageNotice
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    isNew: editingId.value ? undefined : true,
    isHot: false,
  };

  try {
    await adminStore.upsertProduct(product);
    dialogVisible.value = false;
    MessagePlugin.success(editingId.value ? '商品已更新' : '商品已新增');
  } catch (error) {
    MessagePlugin.error(error instanceof Error ? error.message : '商品保存失败');
  }
}

function removeProduct(product: ProductItem) {
  const dialog = DialogPlugin({
    header: '确认删除商品？',
    body: `确认删除「${product.title}」吗？`,
    confirmBtn: '删除',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        await adminStore.removeProduct(product.id);
        MessagePlugin.success('商品已删除');
      } catch (error) {
        MessagePlugin.error(error instanceof Error ? error.message : '商品删除失败');
      }
      dialog.hide();
    },
    onClose: () => dialog.hide(),
  });
}
</script>

<template>
  <div class="admin-page">
    <div class="page-toolbar">
      <div class="toolbar-pills">
        <span class="toolbar-chip">共 {{ products.length }} 个商品</span>
      </div>
      <t-select v-model="categoryFilter" :options="filterOptions" class="toolbar-select" />
      <t-button theme="primary" @click="openCreate">新增商品</t-button>
    </div>

    <t-card class="admin-card table-card">
      <t-table :data="products" :columns="columns" row-key="id" hover table-layout="auto">
        <template #cover="{ row }">
          <img :src="row.cover" :alt="row.title" class="admin-thumb" />
        </template>

        <template #title="{ row }">
          <div class="table-title">{{ row.title }}</div>
          <div class="table-desc">{{ row.description }}</div>
        </template>

        <template #category="{ row }">
          <span class="admin-chip">{{ categoryNameMap[row.category] || row.category }}</span>
        </template>

        <template #price="{ row }">
          <span class="price-current">¥{{ row.price }}</span>
        </template>

        <template #tags="{ row }">
          <div class="admin-tag-list">
            <span v-for="tag in row.tags" :key="tag" class="admin-chip">{{ tag }}</span>
          </div>
        </template>

        <template #actions="{ row }">
          <t-space>
            <t-link theme="primary" hover="color" @click="openEdit(row)">编辑</t-link>
            <t-link theme="danger" hover="color" @click="removeProduct(row)">删除</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <t-dialog
      v-model:visible="dialogVisible"
      :header="editingId ? '编辑商品' : '新增商品'"
      width="760px"
      confirm-btn="保存"
      cancel-btn="取消"
      @confirm="saveProduct"
    >
      <div class="form-grid">
        <div class="field field-full">
          <span>商品名称</span>
          <t-input v-model="form.title" placeholder="请输入商品名称" />
        </div>
        <div class="field field-full">
          <span>商品简介</span>
          <t-textarea v-model="form.description" placeholder="请输入商品简介" :autosize="{ minRows: 3, maxRows: 5 }" />
        </div>
        <div class="field">
          <span>售价</span>
          <t-input-number v-model="form.price" theme="normal" />
        </div>
        <div class="field">
          <span>分类</span>
          <t-select v-model="form.category" :options="categoryOptions" placeholder="请选择商品分类" />
        </div>
        <div class="field">
          <span>销量</span>
          <t-input-number v-model="form.sales" theme="normal" />
        </div>
        <div class="field field-full">
          <span>封面图 URL</span>
          <t-input v-model="form.cover" placeholder="请输入封面图链接" />
        </div>
        <div class="field field-full">
          <span>标签</span>
          <t-input v-model="form.tags" placeholder="多个标签用逗号分隔" />
        </div>
        <div class="field field-full">
          <span>详情图集</span>
          <t-textarea
            v-model="form.gallery"
            placeholder="每行一个图片链接"
            :autosize="{ minRows: 3, maxRows: 5 }"
          />
        </div>
        <div class="field field-full">
          <span>详情正文</span>
          <t-textarea
            v-model="form.detailContent"
            placeholder="每行一段详情说明"
            :autosize="{ minRows: 4, maxRows: 8 }"
          />
        </div>
        <div class="field field-full">
          <span>交付内容</span>
          <t-textarea
            v-model="form.deliverables"
            placeholder="每行一条交付内容"
            :autosize="{ minRows: 3, maxRows: 6 }"
          />
        </div>
        <div class="field field-full">
          <span>使用说明</span>
          <t-textarea
            v-model="form.usageNotice"
            placeholder="每行一条使用说明"
            :autosize="{ minRows: 3, maxRows: 6 }"
          />
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
  align-items: center;
  gap: 10px;
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

.toolbar-select {
  width: 180px;
}

.table-card :deep(.t-card__body) {
  padding: 10px 12px 12px;
}

.table-card :deep(.t-table) {
  border-radius: 18px;
  overflow: hidden;
}

.table-card :deep(.t-table th) {
  background: #fff9f5;
  color: var(--admin-text-soft);
  font-weight: 600;
}

.table-card :deep(.t-table td) {
  background: rgba(255, 255, 255, 0.78);
}

.table-card :deep(.t-table tr:hover td) {
  background: #fffdfb;
}

.table-title {
  font-weight: 700;
}

.table-desc {
  margin-top: 6px;
  color: var(--admin-text-soft);
  font-size: 13px;
}

.price-current {
  font-weight: 700;
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

@media (max-width: 640px) {
  .toolbar-pills {
    width: 100%;
  }

  .toolbar-select {
    width: 100%;
  }
}
</style>

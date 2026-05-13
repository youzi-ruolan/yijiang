<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { useAdminStore } from '@/stores/admin';
import type { CategoryItem } from '@/types';

const adminStore = useAdminStore();
const dialogVisible = ref(false);
const editingId = ref('');

const form = reactive({
  name: '',
  filterKey: '',
  target: 'productSection',
});

const targetOptions = [
  { label: '商品分类', value: 'productSection' },
  { label: '灵感内容', value: 'inspirationSection' },
  { label: '文章内容', value: 'articleSection' },
];

const targetLabelMap: Record<string, string> = {
  productSection: '商品分类',
  inspirationSection: '灵感内容',
  articleSection: '文章内容',
};

const categories = computed(() =>
  adminStore.dataset.categories.map((category) => ({
    ...category,
    targetLabel: targetLabelMap[category.target] || category.target,
    preview:
      category.target === 'inspirationSection'
        ? adminStore.dataset.inspirations[0]?.cover
        : category.target === 'articleSection'
          ? adminStore.dataset.articles[0]?.cover
          : adminStore.dataset.products.find((item) =>
              category.filterKey === 'all' ? true : item.category === category.filterKey,
            )?.cover,
  })),
);

function toFilterKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fa5-_]/g, '');
}

function resetForm() {
  form.name = '';
  form.filterKey = '';
  form.target = 'productSection';
}

function openCreate() {
  editingId.value = '';
  resetForm();
  dialogVisible.value = true;
}

function openEdit(category: CategoryItem) {
  editingId.value = category.id;
  form.name = category.name;
  form.filterKey = category.filterKey;
  form.target = category.target;
  dialogVisible.value = true;
}

async function saveCategory() {
  const name = form.name.trim();
  const filterKey = toFilterKey(form.filterKey || form.name);

  if (!name || !filterKey) {
    MessagePlugin.warning('请先填写分类名称和标识');
    return;
  }

  const duplicated = adminStore.dataset.categories.find(
    (item) => item.filterKey === filterKey && item.id !== editingId.value,
  );
  if (duplicated) {
    MessagePlugin.warning('分类标识已存在，请更换后再保存');
    return;
  }

  try {
    await adminStore.upsertCategory({
      id: editingId.value || `category_${Date.now()}`,
      name,
      filterKey,
      target: form.target,
    });

    dialogVisible.value = false;
    MessagePlugin.success(editingId.value ? '分类已更新' : '分类已新增');
  } catch (error) {
    MessagePlugin.error(error instanceof Error ? error.message : '分类保存失败');
  }
}

function removeCategory(category: CategoryItem) {
  if (category.filterKey === 'all') {
    MessagePlugin.warning('默认“全部”分类建议保留');
    return;
  }

  const dialog = DialogPlugin({
    header: '确认删除分类？',
    body: `确认删除「${category.name}」吗？相关商品会自动切换到其他分类。`,
    confirmBtn: '删除',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        await adminStore.removeCategory(category.id);
        MessagePlugin.success('分类已删除');
      } catch (error) {
        MessagePlugin.error(error instanceof Error ? error.message : '分类删除失败');
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
      <t-button theme="primary" @click="openCreate">新增分类</t-button>
    </div>

    <t-card class="admin-card">
      <div class="category-list">
        <div class="category-list__head">
          <span>分类信息</span>
          <span>分类标识</span>
          <span>归属模块</span>
          <span>数据 ID</span>
          <span>操作</span>
        </div>

        <div v-for="category in categories" :key="category.id" class="category-item">
          <div class="category-main">
            <img :src="category.preview" :alt="category.name" class="category-thumb" />
            <div class="category-main__info">
              <div class="category-name">{{ category.name }}</div>
            </div>
          </div>

          <div class="category-cell">
            <span class="category-label-mobile">分类标识</span>
            <span class="category-plain">{{ category.filterKey }}</span>
          </div>

          <div class="category-cell">
            <span class="category-label-mobile">归属模块</span>
            <span class="admin-chip">{{ category.targetLabel }}</span>
          </div>

          <div class="category-cell">
            <span class="category-label-mobile">数据 ID</span>
            <span class="category-plain">{{ category.id }}</span>
          </div>

          <div class="category-actions">
            <t-link theme="primary" hover="color" @click="openEdit(category)">编辑</t-link>
            <t-link theme="danger" hover="color" @click="removeCategory(category)">删除</t-link>
          </div>
        </div>
      </div>
    </t-card>

    <t-dialog
      v-model:visible="dialogVisible"
      :header="editingId ? '编辑分类' : '新增分类'"
      width="620px"
      confirm-btn="保存"
      cancel-btn="取消"
      @confirm="saveCategory"
    >
      <div class="form-grid">
        <div class="field">
          <span>分类名称</span>
          <t-input v-model="form.name" placeholder="请输入分类名称" />
        </div>
        <div class="field">
          <span>分类标识</span>
          <t-input v-model="form.filterKey" placeholder="如：wedding / retouch" />
        </div>
        <div class="field field-full">
          <span>归属模块</span>
          <t-select v-model="form.target" :options="targetOptions" />
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
}

.category-list {
  display: flex;
  flex-direction: column;
}

.category-list__head,
.category-item {
  display: grid;
  grid-template-columns: minmax(280px, 2fr) minmax(120px, 0.8fr) minmax(120px, 0.9fr) minmax(150px, 1fr) 120px;
  gap: 16px;
  align-items: center;
}

.category-list__head {
  padding: 0 16px 12px;
  color: var(--admin-text-soft);
  font-size: 12px;
  font-weight: 600;
}

.category-item {
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(239, 228, 218, 0.72);
}

.category-item + .category-item {
  margin-top: 12px;
}

.category-main {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.category-thumb {
  width: 88px;
  height: 64px;
  border-radius: 14px;
  object-fit: cover;
  background: var(--admin-bg);
  flex-shrink: 0;
}

.category-main__info {
  min-width: 0;
}

.category-name {
  font-size: 16px;
  font-weight: 700;
}

.category-plain {
  color: var(--admin-text-soft);
  font-size: 13px;
  line-height: 1.7;
}

.category-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  justify-content: flex-end;
}

.category-label-mobile {
  display: none;
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

@media (max-width: 1100px) {
  .category-list__head {
    display: none;
  }

  .category-item {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .category-cell,
  .category-actions {
    padding-left: 102px;
  }

  .category-label-mobile {
    display: block;
    margin-bottom: 4px;
    color: var(--admin-text-soft);
    font-size: 12px;
  }

  .category-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .category-main {
    align-items: flex-start;
  }

  .category-thumb {
    width: 72px;
    height: 54px;
  }

  .category-cell,
  .category-actions {
    padding-left: 0;
  }
}
</style>

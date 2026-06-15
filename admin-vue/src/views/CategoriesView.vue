<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
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
    ElMessage.warning('请先填写分类名称和标识');
    return;
  }

  const duplicated = adminStore.dataset.categories.find(
    (item) => item.filterKey === filterKey && item.id !== editingId.value,
  );
  if (duplicated) {
    ElMessage.warning('分类标识已存在，请更换后再保存');
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
    ElMessage.success(editingId.value ? '分类已更新' : '分类已新增');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '分类保存失败');
  }
}

async function removeCategory(category: CategoryItem) {
  if (category.filterKey === 'all') {
    ElMessage.warning('默认"全部"分类建议保留');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确认删除「${category.name}」吗？相关商品会自动切换到其他分类。`,
      '确认删除分类？',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    );
    await adminStore.removeCategory(category.id);
    ElMessage.success('分类已删除');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error instanceof Error ? error.message : '分类删除失败');
    }
  }
}
</script>

<template>
  <div class="admin-page">
    <div class="page-toolbar">
      <el-button type="primary" @click="openCreate">新增分类</el-button>
    </div>

    <el-card class="admin-card" shadow="never">
      <div class="category-list">
        <div class="category-list__head data-table-head">
          <span>分类名称</span>
          <span>分类标识</span>
          <span>归属模块</span>
          <span>数据 ID</span>
          <span>操作</span>
        </div>

        <div v-for="category in categories" :key="category.id" class="category-item data-table-row">
          <div class="category-name">{{ category.name }}</div>

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
            <span class="category-plain category-id">{{ category.id }}</span>
          </div>

          <div class="category-actions">
            <el-button link type="primary" @click="openEdit(category)">编辑</el-button>
            <el-button link type="danger" @click="removeCategory(category)">删除</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑分类' : '新增分类'"
      width="560px"
      destroy-on-close
    >
      <div class="form-grid">
        <div class="field">
          <span>分类名称</span>
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </div>
        <div class="field">
          <span>分类标识</span>
          <el-input v-model="form.filterKey" placeholder="如：wedding / retouch" />
        </div>
        <div class="field field-full">
          <span>归属模块</span>
          <el-select v-model="form.target" style="width: 100%">
            <el-option v-for="opt in targetOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.category-list__head,
.category-item {
  grid-template-columns: minmax(140px, 1.2fr) minmax(120px, 1fr) minmax(100px, 0.8fr) minmax(120px, 1fr) 120px;
}

.category-name {
  font-size: 14px;
  font-weight: 500;
}

.category-plain {
  color: var(--admin-text-soft);
  font-size: 13px;
}

.category-id {
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
}

.category-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

.category-label-mobile {
  display: none;
}

@media (max-width: 1100px) {
  .category-list__head {
    display: none;
  }

  .category-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .category-cell,
  .category-actions {
    padding-left: 0;
  }

  .category-label-mobile {
    display: block;
    margin-bottom: 2px;
    color: var(--admin-text-soft);
    font-size: 12px;
  }

  .category-actions {
    justify-content: flex-start;
    padding-left: 0;
  }
}

@media (max-width: 640px) {
  .category-cell {
    padding-left: 0;
  }
}
</style>

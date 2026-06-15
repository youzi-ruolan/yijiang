<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import AssetImageField from '@/components/AssetImageField.vue';
import { useAdminStore } from '@/stores/admin';
import type { BannerItem } from '@/types';

const adminStore = useAdminStore();
const dialogVisible = ref(false);
const editingId = ref('');

const form = reactive({
  title: '',
  subtitle: '',
  description: '',
  image: '',
  badge: '',
  buttonText: '',
});

function resetForm() {
  form.title = '';
  form.subtitle = '';
  form.description = '';
  form.image = '';
  form.badge = '';
  form.buttonText = '';
}

function openCreate() {
  editingId.value = '';
  resetForm();
  dialogVisible.value = true;
}

function openEdit(item: BannerItem) {
  editingId.value = item.id;
  form.title = item.title;
  form.subtitle = item.subtitle;
  form.description = item.description || '';
  form.image = item.image;
  form.badge = item.badge || '';
  form.buttonText = item.buttonText || '';
  dialogVisible.value = true;
}

async function saveCurrent() {
  const id = editingId.value || `banner_${Date.now()}`;
  const title = form.title.trim();
  const image = form.image.trim();

  if (!title || !image) {
    ElMessage.warning('请先填写标题和图片链接');
    return;
  }

  try {
    await adminStore.upsertBanner({
      id,
      title,
      subtitle: form.subtitle.trim(),
      description: form.description.trim(),
      image,
      buttonText: form.buttonText.trim(),
      badge: form.badge.trim(),
    });

    dialogVisible.value = false;
    ElMessage.success(editingId.value ? 'Banner 已更新' : 'Banner 已新增');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Banner 保存失败');
  }
}

async function removeCurrent(item: BannerItem) {
  try {
    await ElMessageBox.confirm(`确认删除「${item.title}」吗？`, '确认删除 Banner？', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await adminStore.removeBanner(item.id);
    ElMessage.success('Banner 已删除');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error instanceof Error ? error.message : 'Banner 删除失败');
    }
  }
}
</script>

<template>
  <div class="admin-page">
    <el-card class="admin-card" shadow="never">
      <div class="section-toolbar">
        <div class="section-title">首页 Banner</div>
        <el-button type="primary" @click="openCreate">新增 Banner</el-button>
      </div>

      <div class="content-table">
        <div class="content-table__head data-table-head">
          <span>内容信息</span>
          <span>补充信息</span>
          <span>操作</span>
        </div>
        <div v-for="item in adminStore.dataset.banners" :key="item.id" class="content-row data-table-row">
          <div class="content-main">
            <el-image
              :src="item.image"
              :alt="item.title"
              fit="cover"
              class="content-thumb"
              :preview-src-list="[item.image]"
              preview-teleported
            />
            <div>
              <div class="content-title">{{ item.title }}</div>
              <div class="content-meta">{{ item.subtitle }}</div>
            </div>
          </div>
          <div class="content-extra">{{ item.badge || '无角标' }} · {{ item.buttonText || '无按钮文案' }}</div>
          <div class="content-actions">
            <el-button link type="primary" @click="openEdit(item)">编辑</el-button>
            <el-button link type="danger" @click="removeCurrent(item)">删除</el-button>
          </div>
        </div>
        <div v-if="!adminStore.dataset.banners.length" class="admin-empty">暂无 Banner，点击右上角新增。</div>
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑 Banner' : '新增 Banner'"
      width="720px"
      destroy-on-close
    >
      <div class="form-grid">
        <div class="field field-full">
          <span>标题</span>
          <el-input v-model="form.title" placeholder="请输入标题" />
        </div>
        <div class="field field-full">
          <span>副标题</span>
          <el-input v-model="form.subtitle" placeholder="请输入副标题" />
        </div>
        <AssetImageField v-model="form.image" label="Banner 图片" placeholder="请输入图片链接，或从资源库选择" />
        <div class="field">
          <span>角标</span>
          <el-input v-model="form.badge" placeholder="请输入角标文案" />
        </div>
        <div class="field">
          <span>按钮文案</span>
          <el-input v-model="form.buttonText" placeholder="请输入按钮文案" />
        </div>
        <div class="field field-full">
          <span>补充描述</span>
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCurrent">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.section-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
}

.content-table__head,
.content-row {
  grid-template-columns: minmax(280px, 2fr) minmax(160px, 1fr) 120px;
}

.content-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.content-thumb {
  width: 72px;
  height: 72px;
  border-radius: var(--admin-radius-sm);
  background: var(--admin-bg);
  border: 1px solid var(--admin-line);
  flex-shrink: 0;
  overflow: hidden;
}

.content-thumb :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.content-title {
  font-weight: 500;
  font-size: 14px;
}

.content-meta {
  margin-top: 4px;
  color: var(--admin-text-soft);
  font-size: 13px;
}

.content-extra {
  color: var(--admin-text-soft);
  font-size: 13px;
}

.content-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .section-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .content-table__head {
    display: none;
  }

  .content-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .content-actions {
    justify-content: flex-start;
  }
}
</style>

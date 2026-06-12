<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { createAssetUploadSignatureApi } from '@/api/admin';
import { useAdminStore } from '@/stores/admin';
import type { AssetItem, AssetType } from '@/types';

const adminStore = useAdminStore();

const typeFilter = ref<'all' | AssetType>('all');
const keyword = ref('');
const dialogVisible = ref(false);
const editingId = ref('');
const uploadInputRef = ref<HTMLInputElement | null>(null);
const uploading = ref(false);

const form = reactive({
  name: '',
  type: 'image' as AssetType,
  url: '',
  cover: '',
  description: '',
  tags: '',
  sort: 0,
  status: 'ACTIVE',
});

const formTypeOptions = [
  { label: '图片', value: 'image' },
  { label: '视频', value: 'video' },
];

const statusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' },
];

const maxImageSize = 20 * 1024 * 1024;
const maxVideoSize = 500 * 1024 * 1024;

const filteredAssets = computed(() => {
  const keywordText = keyword.value.trim().toLowerCase();

  return adminStore.dataset.assets.filter((item) => {
    const matchesType = typeFilter.value === 'all' || item.type === typeFilter.value;
    const matchesKeyword =
      !keywordText ||
      `${item.name} ${item.description || ''} ${(item.tags || []).join(' ')}`.toLowerCase().includes(keywordText);

    return matchesType && matchesKeyword;
  });
});

function resetForm() {
  form.name = '';
  form.type = 'image';
  form.url = '';
  form.cover = '';
  form.description = '';
  form.tags = '';
  form.sort = 0;
  form.status = 'ACTIVE';
}

function openCreate() {
  editingId.value = '';
  resetForm();
  dialogVisible.value = true;
}

function openEdit(asset: AssetItem) {
  editingId.value = asset.id;
  form.name = asset.name;
  form.type = asset.type;
  form.url = asset.url;
  form.cover = asset.cover || '';
  form.description = asset.description || '';
  form.tags = (asset.tags || []).join(', ');
  form.sort = asset.sort || 0;
  form.status = asset.status || 'ACTIVE';
  dialogVisible.value = true;
}

async function copyUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    ElMessage.success('链接已复制');
  } catch {
    ElMessage.error('复制失败，请手动复制链接');
  }
}

function openUploadPicker() {
  uploadInputRef.value?.click();
}

function resolveFileType(file: File): AssetType | null {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) return 'image';
  if (['mp4', 'mov', 'm4v', 'webm'].includes(extension)) return 'video';

  return null;
}

function validateUploadFile(file: File, type: AssetType) {
  if (type === 'image' && file.size > maxImageSize) {
    ElMessage.warning('图片不能超过 20MB');
    return false;
  }

  if (type === 'video' && file.size > maxVideoSize) {
    ElMessage.warning('视频不能超过 500MB');
    return false;
  }

  return true;
}

function getFileNameWithoutExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '');
}

async function handleUploadFile(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = '';

  if (!file) return;

  const type = resolveFileType(file);
  if (!type) {
    ElMessage.warning('仅支持图片 jpg/jpeg/png/webp/gif 或视频 mp4/mov/m4v/webm');
    return;
  }

  if (!validateUploadFile(file, type)) return;

  uploading.value = true;
  try {
    const signature = await createAssetUploadSignatureApi({
      fileName: file.name,
      type,
      mimeType: file.type || undefined,
    });
    const response = await fetch(signature.uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: signature.authorization,
        'Content-Type': signature.contentType,
      },
      body: file,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `COS 上传失败：${response.status}`);
    }

    await adminStore.upsertAsset({
      id: `asset_${Date.now()}`,
      name: getFileNameWithoutExtension(file.name),
      type,
      url: signature.publicUrl,
      cover: '',
      description: `上传文件：${file.name}`,
      tags: [],
      sort: 0,
      status: 'ACTIVE',
    });

    ElMessage.success('文件已上传并保存到资源库');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '文件上传失败');
  } finally {
    uploading.value = false;
  }
}

async function saveAsset() {
  const name = form.name.trim();
  const url = form.url.trim();

  if (!name || !url) {
    ElMessage.warning('请填写文件名称和 COS 链接');
    return;
  }

  try {
    await adminStore.upsertAsset({
      id: editingId.value || `asset_${Date.now()}`,
      name,
      type: form.type,
      url,
      cover: form.cover.trim(),
      description: form.description.trim(),
      tags: form.tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      sort: Number(form.sort) || 0,
      status: form.status,
    });

    dialogVisible.value = false;
    ElMessage.success(editingId.value ? '文件已更新' : '文件已新增');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '文件保存失败');
  }
}

async function removeAsset(asset: AssetItem) {
  try {
    await ElMessageBox.confirm(
      `确认删除「${asset.name}」吗？已被商品手动引用的链接不会自动清除。`,
      '确认删除文件？',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    );
    await adminStore.removeAsset(asset.id);
    ElMessage.success('文件已删除');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error instanceof Error ? error.message : '文件删除失败');
    }
  }
}
</script>

<template>
  <div class="admin-page">
    <div class="page-toolbar">
      <div class="toolbar-pills">
        <span class="toolbar-chip">共 {{ filteredAssets.length }} 个文件</span>
        <span class="toolbar-chip">COS 外链资源库</span>
      </div>
      <el-input v-model="keyword" clearable placeholder="搜索名称、描述、标签" class="toolbar-search" />
      <el-select v-model="typeFilter" class="toolbar-select" placeholder="全部文件">
        <el-option label="全部文件" value="all" />
        <el-option label="图片" value="image" />
        <el-option label="视频" value="video" />
      </el-select>
      <input
        ref="uploadInputRef"
        class="upload-input"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
        @change="handleUploadFile"
      />
      <el-button :loading="uploading" @click="openUploadPicker">上传文件</el-button>
      <el-button type="primary" @click="openCreate">新增文件</el-button>
    </div>

    <el-card class="admin-card" shadow="never">
      <div class="asset-grid">
        <div v-for="asset in filteredAssets" :key="asset.id" class="asset-card">
          <div class="asset-preview">
            <img v-if="asset.type === 'image'" :src="asset.url" :alt="asset.name" class="asset-preview__media" />
            <video v-else :src="asset.url" :poster="asset.cover" class="asset-preview__media" controls />
          </div>
          <div class="asset-body">
            <div class="asset-title-row">
              <div class="asset-title">{{ asset.name }}</div>
              <span class="admin-chip">{{ asset.type === 'image' ? '图片' : '视频' }}</span>
            </div>
            <div class="asset-desc">{{ asset.description || '暂无描述' }}</div>
            <div class="asset-url" :title="asset.url">{{ asset.url }}</div>
            <div v-if="asset.tags.length" class="admin-tag-list">
              <span v-for="tag in asset.tags" :key="tag" class="admin-chip">{{ tag }}</span>
            </div>
            <div class="asset-actions">
              <el-button link type="primary" @click="copyUrl(asset.url)">复制链接</el-button>
              <el-button link type="primary" @click="openEdit(asset)">编辑</el-button>
              <el-button link type="danger" @click="removeAsset(asset)">删除</el-button>
            </div>
          </div>
        </div>
        <div v-if="!filteredAssets.length" class="admin-empty">暂无文件，先把 COS 中的图片或视频链接录入这里。</div>
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑文件' : '新增文件'"
      width="720px"
      destroy-on-close
    >
      <div class="form-grid">
        <div class="field">
          <span>文件名称</span>
          <el-input v-model="form.name" placeholder="例如：商品主图 / 案例演示视频" />
        </div>
        <div class="field">
          <span>文件类型</span>
          <el-select v-model="form.type" style="width: 100%">
            <el-option v-for="opt in formTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
        <div class="field field-full">
          <span>COS 文件 URL</span>
          <el-input v-model="form.url" placeholder="请输入腾讯云 COS 图片或视频访问链接" />
        </div>
        <div class="field field-full">
          <span>视频封面 URL</span>
          <el-input v-model="form.cover" placeholder="视频可填写封面图；图片可留空" />
        </div>
        <div class="field">
          <span>排序</span>
          <el-input-number v-model="form.sort" :min="0" controls-position="right" style="width: 100%" />
        </div>
        <div class="field">
          <span>状态</span>
          <el-select v-model="form.status" style="width: 100%">
            <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
        <div class="field field-full">
          <span>标签</span>
          <el-input v-model="form.tags" placeholder="多个标签用逗号分隔" />
        </div>
        <div class="field field-full">
          <span>描述</span>
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入文件用途说明" />
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAsset">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.upload-input {
  display: none;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.asset-card {
  overflow: hidden;
  border-radius: var(--admin-radius-md);
  background: #ffffff;
  border: 1px solid var(--admin-line);
  transition: box-shadow 0.15s;
}

.asset-card:hover {
  box-shadow: var(--admin-shadow-soft);
}

.asset-preview {
  aspect-ratio: 16 / 10;
  background: var(--admin-bg);
}

.asset-preview__media {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.asset-body {
  padding: 12px;
}

.asset-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.asset-title {
  font-weight: 500;
  font-size: 14px;
}

.asset-desc,
.asset-url {
  margin-top: 6px;
  color: var(--admin-text-soft);
  font-size: 12px;
}

.asset-url {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 10px;
}
</style>

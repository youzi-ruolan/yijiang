<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Upload } from '@element-plus/icons-vue';
import { useAssetUpload } from '@/composables/useAssetUpload';
import { useAdminStore } from '@/stores/admin';
import type { AssetItem, AssetType } from '@/types';

const adminStore = useAdminStore();
const { uploading, uploadProgress, uploadFiles, recentUploads, clearRecentUploads } = useAssetUpload();

const typeFilter = ref<'all' | AssetType>('all');
const keyword = ref('');
const dialogVisible = ref(false);
const editingId = ref('');
const dragOver = ref(false);
const uploadInputRef = ref<HTMLInputElement | null>(null);

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

const assetUsageMap = computed(() => {
  const map = new Map<string, string[]>();

  const addUsage = (url: string, label: string) => {
    if (!url) return;
    const current = map.get(url) || [];
    if (!current.includes(label)) {
      current.push(label);
      map.set(url, current);
    }
  };

  for (const product of adminStore.dataset.products) {
    addUsage(product.cover, `商品封面：${product.title}`);
    for (const line of product.gallery || []) {
      if (line.startsWith('{')) {
        try {
          const parsed = JSON.parse(line) as { url?: string };
          addUsage(parsed.url || '', `商品详情：${product.title}`);
        } catch {
          // ignore invalid json line
        }
      } else {
        addUsage(line, `商品详情：${product.title}`);
      }
    }
  }

  for (const banner of adminStore.dataset.banners) {
    addUsage(banner.image, `Banner：${banner.title}`);
  }

  return map;
});

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

function getUsageLabels(asset: AssetItem) {
  return assetUsageMap.value.get(asset.url) || [];
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

async function handleSelectedFiles(fileList: FileList | File[]) {
  const files = Array.from(fileList);
  if (!files.length) return;
  await uploadFiles(files);
}

async function handleUploadFile(event: Event) {
  const target = event.target as HTMLInputElement;
  await handleSelectedFiles(target.files || []);
  target.value = '';
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
  dragOver.value = true;
}

function onDragLeave() {
  dragOver.value = false;
}

async function onDrop(event: DragEvent) {
  event.preventDefault();
  dragOver.value = false;
  await handleSelectedFiles(event.dataTransfer?.files || []);
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
  const usage = getUsageLabels(asset);
  const usageTip = usage.length ? `该文件已被引用：${usage.slice(0, 2).join('、')}${usage.length > 2 ? ' 等' : ''}。` : '';

  try {
    await ElMessageBox.confirm(`${usageTip}确认删除「${asset.name}」吗？`, '确认删除文件？', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
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
        <span class="toolbar-chip">上传后可在商品管理中直接选用</span>
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
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
        @change="handleUploadFile"
      />
      <el-button type="primary" :icon="Upload" :loading="uploading" @click="openUploadPicker">上传文件</el-button>
      <el-button @click="openCreate">录入外链</el-button>
    </div>

    <div
      class="upload-dropzone"
      :class="{ 'upload-dropzone--active': dragOver, 'upload-dropzone--loading': uploading }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @click="openUploadPicker"
    >
      <el-icon class="upload-dropzone__icon"><Upload /></el-icon>
      <div class="upload-dropzone__title">
        {{ uploading ? uploadProgress || '正在上传...' : '拖拽文件到此处上传，或点击选择文件' }}
      </div>
      <div class="upload-dropzone__desc">文件经后端上传到 COS，上传成功后会显示访问链接和缩略图预览</div>
    </div>

    <el-card v-if="recentUploads.length" class="admin-card recent-uploads" shadow="never">
      <div class="recent-uploads__head">
        <span class="recent-uploads__title">最近上传（{{ recentUploads.length }}）</span>
        <el-button link type="primary" @click="clearRecentUploads">清空</el-button>
      </div>
      <div class="recent-uploads__list">
        <div v-for="asset in recentUploads" :key="asset.id" class="recent-upload-item">
          <div class="recent-upload-item__preview">
            <el-image
              v-if="asset.type === 'image'"
              :src="asset.url"
              :alt="asset.name"
              fit="cover"
              :preview-src-list="[asset.url]"
              preview-teleported
            />
            <video v-else :src="asset.url" :poster="asset.cover" controls class="recent-upload-item__video" />
          </div>
          <div class="recent-upload-item__body">
            <div class="recent-upload-item__name">{{ asset.name }}</div>
            <div class="recent-upload-item__url" :title="asset.url">{{ asset.url }}</div>
            <div class="recent-upload-item__actions">
              <el-button size="small" type="primary" plain @click="copyUrl(asset.url)">复制链接</el-button>
              <el-button v-if="asset.type === 'image'" size="small" link type="primary">
                <a :href="asset.url" target="_blank" rel="noopener noreferrer">新窗口预览</a>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-card class="admin-card" shadow="never">
      <div v-if="filteredAssets.length" class="asset-grid">
        <div v-for="asset in filteredAssets" :key="asset.id" class="asset-card" :class="{ 'asset-card--highlight': recentUploads.some((item) => item.id === asset.id) }">
          <div class="asset-preview">
            <el-image
              v-if="asset.type === 'image'"
              :src="asset.url"
              :alt="asset.name"
              fit="cover"
              class="asset-preview__media"
              :preview-src-list="[asset.url]"
              preview-teleported
            />
            <video v-else :src="asset.url" :poster="asset.cover" class="asset-preview__media" controls />
          </div>
          <div class="asset-body">
            <div class="asset-title-row">
              <div class="asset-title">{{ asset.name }}</div>
              <span class="admin-chip">{{ asset.type === 'image' ? '图片' : '视频' }}</span>
            </div>
            <div class="asset-desc">{{ asset.description || '暂无描述' }}</div>
            <div v-if="getUsageLabels(asset).length" class="asset-usage">
              已用于 {{ getUsageLabels(asset).length }} 处：{{ getUsageLabels(asset)[0] }}
            </div>
            <div class="asset-url" :title="asset.url">{{ asset.url }}</div>
            <div v-if="asset.tags.length" class="admin-tag-list">
              <span v-for="tag in asset.tags" :key="tag" class="admin-chip">{{ tag }}</span>
            </div>
            <div class="asset-actions">
              <el-button link type="primary" @click.stop="copyUrl(asset.url)">复制链接</el-button>
              <el-button link type="primary" @click.stop="openEdit(asset)">编辑</el-button>
              <el-button link type="danger" @click.stop="removeAsset(asset)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="admin-empty">
        暂无文件，拖拽上传或点击上方上传区域添加图片、视频。
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑文件' : '录入外链文件'"
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
          <el-input v-model="form.tags" placeholder="多个标签用逗号分隔，如：封面,详情" />
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

.upload-dropzone {
  border: 1px dashed var(--admin-primary-line);
  border-radius: var(--admin-radius-lg);
  background: var(--admin-primary-soft);
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.upload-dropzone:hover,
.upload-dropzone--active {
  border-color: var(--admin-primary);
  background: #f0f8ff;
}

.upload-dropzone--loading {
  pointer-events: none;
  opacity: 0.85;
}

.upload-dropzone__icon {
  font-size: 32px;
  color: var(--admin-primary);
  margin-bottom: 8px;
}

.upload-dropzone__title {
  font-size: 15px;
  font-weight: 500;
  color: var(--admin-text);
}

.upload-dropzone__desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--admin-text-soft);
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
.asset-url,
.asset-usage {
  margin-top: 6px;
  color: var(--admin-text-soft);
  font-size: 12px;
}

.asset-usage {
  color: var(--admin-primary);
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

.recent-uploads :deep(.el-card__body) {
  padding: 16px;
}

.recent-uploads__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.recent-uploads__title {
  font-size: 15px;
  font-weight: 600;
}

.recent-uploads__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-upload-item {
  display: flex;
  gap: 14px;
  padding: 12px;
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius-md);
  background: var(--admin-bg-soft);
}

.recent-upload-item__preview {
  width: 96px;
  height: 96px;
  flex-shrink: 0;
  border-radius: var(--admin-radius-sm);
  overflow: hidden;
  border: 1px solid var(--admin-line);
  background: #fff;
}

.recent-upload-item__preview :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.recent-upload-item__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recent-upload-item__body {
  min-width: 0;
  flex: 1;
}

.recent-upload-item__name {
  font-weight: 500;
  font-size: 14px;
}

.recent-upload-item__url {
  margin-top: 6px;
  color: var(--admin-text-soft);
  font-size: 12px;
  word-break: break-all;
  line-height: 1.5;
}

.recent-upload-item__actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.asset-card--highlight {
  border-color: var(--admin-primary);
  box-shadow: 0 0 0 2px var(--admin-primary-soft);
}

.asset-preview :deep(.el-image) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>

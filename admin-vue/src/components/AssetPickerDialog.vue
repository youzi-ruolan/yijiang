<script setup lang="ts">
import { computed, ref } from 'vue';
import { Plus, Upload } from '@element-plus/icons-vue';
import { useAdminStore } from '@/stores/admin';
import { useAssetUpload } from '@/composables/useAssetUpload';
import type { AssetItem, AssetType } from '@/types';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    mode?: 'single' | 'multiple';
    assetType?: 'all' | AssetType;
    selectedUrls?: string[];
  }>(),
  {
    title: '从资源库选择',
    mode: 'single',
    assetType: 'all',
    selectedUrls: () => [],
  },
);

const emit = defineEmits<{
  'update:visible': [value: boolean];
  confirm: [assets: AssetItem[]];
}>();

const adminStore = useAdminStore();
const { uploading, uploadFiles } = useAssetUpload();

const keyword = ref('');
const typeFilter = ref<'all' | AssetType>(props.assetType === 'all' ? 'all' : props.assetType);
const pickedIds = ref<string[]>([]);
const uploadInputRef = ref<HTMLInputElement | null>(null);

const filteredAssets = computed(() => {
  const keywordText = keyword.value.trim().toLowerCase();

  return adminStore.dataset.assets.filter((item) => {
    if (item.status === 'INACTIVE') return false;
    const matchesType = typeFilter.value === 'all' || item.type === typeFilter.value;
    const matchesAssetType = props.assetType === 'all' || item.type === props.assetType;
    const matchesKeyword =
      !keywordText ||
      `${item.name} ${item.description || ''} ${(item.tags || []).join(' ')}`.toLowerCase().includes(keywordText);

    return matchesType && matchesAssetType && matchesKeyword;
  });
});

function close() {
  emit('update:visible', false);
  pickedIds.value = [];
  keyword.value = '';
}

function isPicked(asset: AssetItem) {
  if (props.mode === 'multiple') {
    return pickedIds.value.includes(asset.id);
  }

  return props.selectedUrls.includes(asset.url);
}

function togglePick(asset: AssetItem) {
  if (props.mode === 'single') {
    emit('confirm', [asset]);
    close();
    return;
  }

  const index = pickedIds.value.indexOf(asset.id);
  if (index > -1) {
    pickedIds.value.splice(index, 1);
  } else {
    pickedIds.value.push(asset.id);
  }
}

function confirmMultiple() {
  const assets = adminStore.dataset.assets.filter((item) => pickedIds.value.includes(item.id));
  emit('confirm', assets);
  close();
}

function openUpload() {
  uploadInputRef.value?.click();
}

async function handleUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  target.value = '';

  if (!files.length) return;

  const uploaded = await uploadFiles(files);
  if (props.mode === 'single' && uploaded.length === 1) {
    emit('confirm', uploaded);
    close();
    return;
  }

  pickedIds.value = [...new Set([...pickedIds.value, ...uploaded.map((item) => item.id)])];
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    width="860px"
    destroy-on-close
    class="asset-picker-dialog"
    @close="close"
  >
    <div class="picker-toolbar">
      <el-input v-model="keyword" clearable placeholder="搜索文件名称、描述、标签" class="picker-search" />
      <el-radio-group v-if="assetType === 'all'" v-model="typeFilter" size="small">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="image">图片</el-radio-button>
        <el-radio-button value="video">视频</el-radio-button>
      </el-radio-group>
      <input
        ref="uploadInputRef"
        class="upload-input"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
        @change="handleUpload"
      />
      <el-button :icon="Upload" :loading="uploading" @click="openUpload">上传并选用</el-button>
    </div>

    <div v-if="filteredAssets.length" class="picker-grid">
      <button
        v-for="asset in filteredAssets"
        :key="asset.id"
        type="button"
        class="picker-item"
        :class="{ picked: isPicked(asset) }"
        @click="togglePick(asset)"
      >
        <div class="picker-item__preview">
          <img v-if="asset.type === 'image'" :src="asset.url" :alt="asset.name" />
          <template v-else>
            <img v-if="asset.cover" :src="asset.cover" :alt="asset.name" />
            <div v-else class="picker-item__video-placeholder">视频</div>
          </template>
          <span class="picker-item__type">{{ asset.type === 'image' ? '图片' : '视频' }}</span>
        </div>
        <div class="picker-item__name">{{ asset.name }}</div>
      </button>
    </div>

    <div v-else class="picker-empty">
      <el-icon class="picker-empty__icon"><Plus /></el-icon>
      <p>资源库暂无文件</p>
      <el-button type="primary" :loading="uploading" @click="openUpload">上传第一个文件</el-button>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button v-if="mode === 'multiple'" type="primary" :disabled="!pickedIds.length" @click="confirmMultiple">
        确认选择（{{ pickedIds.length }}）
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.picker-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.picker-search {
  flex: 1;
  min-width: 200px;
}

.upload-input {
  display: none;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  max-height: 420px;
  overflow: auto;
  padding: 2px;
}

.picker-item {
  border: 2px solid var(--admin-line);
  border-radius: var(--admin-radius-md);
  background: #fff;
  padding: 0;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.picker-item:hover,
.picker-item.picked {
  border-color: var(--admin-primary);
  box-shadow: 0 0 0 2px var(--admin-primary-soft);
}

.picker-item__preview {
  position: relative;
  aspect-ratio: 1;
  background: var(--admin-bg);
  overflow: hidden;
  border-radius: calc(var(--admin-radius-md) - 2px) calc(var(--admin-radius-md) - 2px) 0 0;
}

.picker-item__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.picker-item__video-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--admin-text-soft);
  font-size: 13px;
  background: #f5f8fc;
}

.picker-item__type {
  position: absolute;
  left: 6px;
  top: 6px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 11px;
}

.picker-item__name {
  padding: 8px;
  font-size: 12px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker-empty {
  padding: 48px 16px;
  text-align: center;
  color: var(--admin-text-soft);
}

.picker-empty__icon {
  font-size: 40px;
  margin-bottom: 8px;
  color: var(--admin-primary-light-5, #91caff);
}

.picker-empty p {
  margin: 0 0 16px;
}
</style>

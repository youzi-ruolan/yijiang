<script setup lang="ts">
import { ref } from 'vue';
import { Delete, Picture } from '@element-plus/icons-vue';
import AssetPickerDialog from '@/components/AssetPickerDialog.vue';
import type { AssetItem } from '@/types';

withDefaults(
  defineProps<{
    label?: string;
    placeholder?: string;
  }>(),
  {
    label: '图片',
    placeholder: '请输入图片链接，或从资源库选择',
  },
);

const imageUrl = defineModel<string>({ default: '' });
const pickerVisible = ref(false);

function applyImage(assets: AssetItem[]) {
  const asset = assets[0];
  if (!asset || asset.type !== 'image') return;
  imageUrl.value = asset.url;
}
</script>

<template>
  <div class="asset-image-field field field-full">
    <div class="field-label-row">
      <span>{{ label }}</span>
      <el-button link type="primary" @click="pickerVisible = true">从资源库选择</el-button>
    </div>
    <div class="cover-field">
      <div v-if="imageUrl" class="cover-preview">
        <el-image :src="imageUrl" fit="cover" :preview-src-list="[imageUrl]" preview-teleported />
        <el-button class="cover-preview__remove" :icon="Delete" circle size="small" @click="imageUrl = ''" />
      </div>
      <button v-else type="button" class="cover-placeholder" @click="pickerVisible = true">
        <el-icon><Picture /></el-icon>
        <span>选择图片</span>
      </button>
      <el-input v-model="imageUrl" :placeholder="placeholder" class="cover-input" />
    </div>

    <AssetPickerDialog
      v-model:visible="pickerVisible"
      :title="`选择${label}`"
      mode="single"
      asset-type="image"
      :selected-urls="imageUrl ? [imageUrl] : []"
      @confirm="applyImage"
    />
  </div>
</template>

<style scoped>
.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.field-label-row > span {
  color: var(--admin-text-soft);
  font-size: 13px;
}

.cover-field {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.cover-preview {
  position: relative;
  width: 120px;
  height: 72px;
  border-radius: var(--admin-radius-sm);
  overflow: hidden;
  border: 1px solid var(--admin-line);
  flex-shrink: 0;
}

.cover-preview :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.cover-preview__remove {
  position: absolute;
  top: 6px;
  right: 6px;
}

.cover-placeholder {
  width: 120px;
  height: 72px;
  border: 1px dashed var(--admin-primary-line);
  border-radius: var(--admin-radius-sm);
  background: var(--admin-primary-soft);
  color: var(--admin-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 12px;
}

.cover-input {
  flex: 1;
  min-width: 220px;
}
</style>

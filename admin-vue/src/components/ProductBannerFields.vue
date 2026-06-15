<script setup lang="ts">
import { computed, ref } from 'vue';
import { Delete, Picture, Plus } from '@element-plus/icons-vue';
import AssetPickerDialog from '@/components/AssetPickerDialog.vue';
import type { AssetItem } from '@/types';

const bannerImages = defineModel<string[]>('bannerImages', { default: () => [] });

const pickerVisible = ref(false);

const items = computed(() =>
  (bannerImages.value || []).map((url, index) => ({
    index,
    url,
  })),
);

function applyAssets(assets: AssetItem[]) {
  const next = [...(bannerImages.value || [])];
  for (const asset of assets) {
    if (asset.type !== 'image') continue;
    if (!next.includes(asset.url)) {
      next.push(asset.url);
    }
  }
  bannerImages.value = next;
}

function removeItem(index: number) {
  const next = [...(bannerImages.value || [])];
  next.splice(index, 1);
  bannerImages.value = next;
}

function moveItem(index: number, offset: number) {
  const next = [...(bannerImages.value || [])];
  const target = index + offset;
  if (target < 0 || target >= next.length) return;
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  bannerImages.value = next;
}
</script>

<template>
  <div class="field field-full product-banner">
    <div class="field-label-row">
      <div>
        <span>顶部轮播图</span>
        <div class="field-hint">仅图片，用于小程序详情页顶部轮播；留空时使用封面 + 详情图集中的图片</div>
      </div>
      <el-button link type="primary" @click="pickerVisible = true">
        <el-icon><Plus /></el-icon>
        从资源库添加
      </el-button>
    </div>

    <div v-if="items.length" class="banner-grid">
      <div v-for="item in items" :key="`${item.index}-${item.url}`" class="banner-item">
        <div class="banner-item__preview">
          <img :src="item.url" alt="轮播图" />
          <span class="banner-item__index">{{ item.index + 1 }}</span>
          <el-button class="banner-item__remove" :icon="Delete" circle size="small" @click="removeItem(item.index)" />
        </div>
        <div class="banner-item__actions">
          <el-button size="small" text :disabled="item.index === 0" @click="moveItem(item.index, -1)">左移</el-button>
          <el-button size="small" text :disabled="item.index === items.length - 1" @click="moveItem(item.index, 1)">
            右移
          </el-button>
        </div>
      </div>
    </div>

    <button v-else type="button" class="banner-empty" @click="pickerVisible = true">
      <el-icon><Picture /></el-icon>
      <span>点击添加顶部轮播图片</span>
    </button>

    <AssetPickerDialog
      v-model:visible="pickerVisible"
      title="选择顶部轮播图"
      mode="multiple"
      asset-type="image"
      :selected-urls="bannerImages"
      @confirm="applyAssets"
    />
  </div>
</template>

<style scoped>
.field-label-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 12px;
}

.field-label-row > div > span {
  color: var(--admin-text-soft);
  font-size: 13px;
  font-weight: 500;
}

.field-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--admin-text-soft);
  line-height: 1.5;
}

.banner-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 12px;
}

.banner-item {
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius-md);
  background: #fff;
}

.banner-item__preview {
  position: relative;
  aspect-ratio: 1;
  background: var(--admin-bg);
  border-radius: var(--admin-radius-md) var(--admin-radius-md) 0 0;
  overflow: hidden;
}

.banner-item__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-item__index {
  position: absolute;
  left: 6px;
  top: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 11px;
}

.banner-item__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
}

.banner-item__actions {
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 6px 4px;
}

.banner-empty {
  width: 100%;
  border: 1px dashed var(--admin-primary-line);
  border-radius: var(--admin-radius-md);
  background: var(--admin-primary-soft);
  color: var(--admin-primary);
  padding: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
</style>

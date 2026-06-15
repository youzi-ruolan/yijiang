<script setup lang="ts">
import { computed, ref } from 'vue';
import { Delete, Picture, Plus } from '@element-plus/icons-vue';
import AssetPickerDialog from '@/components/AssetPickerDialog.vue';
import type { AssetItem } from '@/types';
import {
  assetToGalleryLine,
  galleryLinesToText,
  galleryTextToLines,
  getGalleryPreviewUrl,
  parseGalleryLine,
} from '@/utils/asset';

const cover = defineModel<string>('cover', { default: '' });
const gallery = defineModel<string>('gallery', { default: '' });

const coverPickerVisible = ref(false);
const galleryPickerVisible = ref(false);
const showAdvanced = ref(false);

const galleryLines = computed({
  get: () => galleryTextToLines(gallery.value),
  set: (lines: string[]) => {
    gallery.value = galleryLinesToText(lines);
  },
});

const galleryItems = computed(() =>
  galleryLines.value.map((line, index) => ({
    index,
    line,
    parsed: parseGalleryLine(line),
    preview: getGalleryPreviewUrl(line),
  })),
);

function applyCover(assets: AssetItem[]) {
  const asset = assets[0];
  if (!asset || asset.type !== 'image') return;
  cover.value = asset.url;
}

function appendGallery(assets: AssetItem[]) {
  const next = [...galleryLines.value];
  for (const asset of assets) {
    const line = assetToGalleryLine(asset);
    if (!next.includes(line)) {
      next.push(line);
    }
  }
  galleryLines.value = next;
}

function removeGalleryItem(index: number) {
  const next = [...galleryLines.value];
  next.splice(index, 1);
  galleryLines.value = next;
}

function moveGalleryItem(index: number, offset: number) {
  const target = index + offset;
  if (target < 0 || target >= galleryLines.value.length) return;
  const next = [...galleryLines.value];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  galleryLines.value = next;
}
</script>

<template>
  <div class="product-media">
    <div class="field field-full">
      <div class="field-label-row">
        <span>商品封面</span>
        <el-button link type="primary" @click="coverPickerVisible = true">从资源库选择</el-button>
      </div>
      <div class="cover-field">
        <div v-if="cover" class="cover-preview">
          <img :src="cover" alt="商品封面" />
          <el-button class="cover-preview__remove" :icon="Delete" circle size="small" @click="cover = ''" />
        </div>
        <button v-else type="button" class="cover-placeholder" @click="coverPickerVisible = true">
          <el-icon><Picture /></el-icon>
          <span>选择封面图</span>
        </button>
        <el-input v-model="cover" placeholder="或直接粘贴图片链接" class="cover-input" />
      </div>
    </div>

    <div class="field field-full">
      <div class="field-label-row">
        <span>详情图集</span>
        <el-button link type="primary" @click="galleryPickerVisible = true">
          <el-icon><Plus /></el-icon>
          从资源库添加
        </el-button>
      </div>

      <div v-if="galleryItems.length" class="gallery-grid">
        <div v-for="item in galleryItems" :key="`${item.index}-${item.line}`" class="gallery-item">
          <div class="gallery-item__preview">
            <img v-if="item.preview" :src="item.preview" :alt="item.parsed.title || '详情媒体'" />
            <div v-else class="gallery-item__placeholder">{{ item.parsed.type === 'video' ? '视频' : '图片' }}</div>
            <span class="gallery-item__badge">{{ item.parsed.type === 'video' ? '视频' : '图片' }}</span>
            <el-button
              class="gallery-item__remove"
              :icon="Delete"
              circle
              size="small"
              @click="removeGalleryItem(item.index)"
            />
          </div>
          <div class="gallery-item__actions">
            <el-button size="small" text :disabled="item.index === 0" @click="moveGalleryItem(item.index, -1)">
              左移
            </el-button>
            <el-button
              size="small"
              text
              :disabled="item.index === galleryItems.length - 1"
              @click="moveGalleryItem(item.index, 1)"
            >
              右移
            </el-button>
          </div>
        </div>
      </div>

      <div v-else class="gallery-empty" @click="galleryPickerVisible = true">
        <el-icon><Plus /></el-icon>
        <span>点击添加详情图片或视频</span>
      </div>

      <el-button class="advanced-toggle" text type="primary" @click="showAdvanced = !showAdvanced">
        {{ showAdvanced ? '收起' : '展开' }}高级编辑（手动编辑链接）
      </el-button>
      <el-input
        v-if="showAdvanced"
        v-model="gallery"
        type="textarea"
        :rows="4"
        placeholder="每行一个图片链接；视频会以 JSON 行保存"
      />
    </div>

    <AssetPickerDialog
      v-model:visible="coverPickerVisible"
      title="选择商品封面"
      mode="single"
      asset-type="image"
      :selected-urls="cover ? [cover] : []"
      @confirm="applyCover"
    />

    <AssetPickerDialog
      v-model:visible="galleryPickerVisible"
      title="添加到详情图集"
      mode="multiple"
      asset-type="all"
      @confirm="appendGallery"
    />
  </div>
</template>

<style scoped>
.product-media {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

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
  height: 120px;
  border-radius: var(--admin-radius-md);
  overflow: hidden;
  border: 1px solid var(--admin-line);
  flex-shrink: 0;
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-preview__remove {
  position: absolute;
  top: 6px;
  right: 6px;
}

.cover-placeholder {
  width: 120px;
  height: 120px;
  border: 1px dashed var(--admin-primary-line);
  border-radius: var(--admin-radius-md);
  background: var(--admin-primary-soft);
  color: var(--admin-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  flex-shrink: 0;
}

.cover-input {
  flex: 1;
  min-width: 220px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 12px;
}

.gallery-item {
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius-md);
  background: #fff;
}

.gallery-item__preview {
  position: relative;
  aspect-ratio: 1;
  background: var(--admin-bg);
  border-radius: var(--admin-radius-md) var(--admin-radius-md) 0 0;
  overflow: hidden;
}

.gallery-item__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-item__placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--admin-text-soft);
  font-size: 12px;
}

.gallery-item__badge {
  position: absolute;
  left: 6px;
  top: 6px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 11px;
}

.gallery-item__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
}

.gallery-item__actions {
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 6px 4px;
}

.gallery-empty {
  border: 1px dashed var(--admin-line);
  border-radius: var(--admin-radius-md);
  padding: 28px;
  text-align: center;
  color: var(--admin-text-soft);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.gallery-empty:hover {
  border-color: var(--admin-primary);
  color: var(--admin-primary);
  background: var(--admin-primary-soft);
}

.advanced-toggle {
  margin-top: 4px;
  padding: 0;
}
</style>

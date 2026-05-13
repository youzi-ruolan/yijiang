<script setup lang="ts">
import { reactive, ref } from 'vue';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { useAdminStore } from '@/stores/admin';
import type { ArticleItem, BannerItem, InspirationItem } from '@/types';

const adminStore = useAdminStore();
const dialogVisible = ref(false);
const currentType = ref<'banner' | 'inspiration' | 'article'>('banner');
const editingId = ref('');

const form = reactive({
  title: '',
  subtitle: '',
  description: '',
  image: '',
  badge: '',
  buttonText: '',
  author: '',
  publishTime: '',
  views: 0,
});

function resetForm() {
  form.title = '';
  form.subtitle = '';
  form.description = '';
  form.image = '';
  form.badge = '';
  form.buttonText = '';
  form.author = '';
  form.publishTime = '';
  form.views = 0;
}

function openCreate(type: 'banner' | 'inspiration' | 'article') {
  currentType.value = type;
  editingId.value = '';
  resetForm();
  dialogVisible.value = true;
}

function openEdit(type: 'banner' | 'inspiration' | 'article', item: BannerItem | InspirationItem | ArticleItem) {
  currentType.value = type;
  editingId.value = item.id;
  form.title = item.title;
  form.image = 'image' in item ? item.image : item.cover;
  form.badge = 'badge' in item ? item.badge || '' : '';
  form.subtitle = 'subtitle' in item ? item.subtitle : '';
  form.description = 'description' in item ? item.description || '' : '';
  form.buttonText = 'buttonText' in item ? item.buttonText || '' : '';
  form.author = 'author' in item ? item.author : '';
  form.publishTime = 'publishTime' in item ? item.publishTime : '';
  form.views = 'views' in item ? item.views : 0;
  dialogVisible.value = true;
}

async function saveCurrent() {
  const id = editingId.value || `${currentType.value}_${Date.now()}`;
  const title = form.title.trim();
  const image = form.image.trim();

  if (!title || !image) {
    MessagePlugin.warning('请先填写标题和图片链接');
    return;
  }

  try {
    if (currentType.value === 'banner') {
      await adminStore.upsertBanner({
        id,
        title,
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        image,
        buttonText: form.buttonText.trim(),
        badge: form.badge.trim(),
      });
    }

    if (currentType.value === 'inspiration') {
      await adminStore.upsertInspiration({
        id,
        title,
        subtitle: form.subtitle.trim(),
        badge: form.badge.trim(),
        cover: image,
      });
    }

    if (currentType.value === 'article') {
      await adminStore.upsertArticle({
        id,
        title,
        cover: image,
        views: Number(form.views),
        author: form.author.trim(),
        publishTime: form.publishTime.trim(),
      });
    }

    dialogVisible.value = false;
    MessagePlugin.success(editingId.value ? '内容已更新' : '内容已新增');
  } catch (error) {
    MessagePlugin.error(error instanceof Error ? error.message : '内容保存失败');
  }
}

function removeCurrent(type: 'banner' | 'inspiration' | 'article', item: BannerItem | InspirationItem | ArticleItem) {
  const dialog = DialogPlugin({
    header: '确认删除内容？',
    body: `确认删除「${item.title}」吗？`,
    confirmBtn: '删除',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        if (type === 'banner') await adminStore.removeBanner(item.id);
        if (type === 'inspiration') await adminStore.removeInspiration(item.id);
        if (type === 'article') await adminStore.removeArticle(item.id);
        MessagePlugin.success('内容已删除');
      } catch (error) {
        MessagePlugin.error(error instanceof Error ? error.message : '内容删除失败');
      }
      dialog.hide();
    },
    onClose: () => dialog.hide(),
  });
}
</script>

<template>
  <div class="admin-page">
    <t-card class="admin-card">
      <div class="section-toolbar">
        <div class="section-title">Banner 管理</div>
        <t-button theme="primary" @click="openCreate('banner')">新增 Banner</t-button>
      </div>
      <div class="content-table">
        <div class="content-table__head">
          <span>内容信息</span>
          <span>补充信息</span>
          <span>操作</span>
        </div>
        <div v-for="item in adminStore.dataset.banners" :key="item.id" class="content-row">
          <div class="content-main">
            <img :src="item.image" :alt="item.title" class="content-thumb" />
            <div>
              <div class="content-title">{{ item.title }}</div>
              <div class="content-meta">{{ item.subtitle }}</div>
            </div>
          </div>
          <div class="content-extra">{{ item.badge || '无角标' }} · {{ item.buttonText || '无按钮文案' }}</div>
          <div class="content-actions">
            <t-link theme="primary" hover="color" @click="openEdit('banner', item)">编辑</t-link>
            <t-link theme="danger" hover="color" @click="removeCurrent('banner', item)">删除</t-link>
          </div>
        </div>
      </div>
    </t-card>

    <t-card class="admin-card">
      <div class="section-toolbar">
        <div class="section-title">灵感内容</div>
        <t-button theme="primary" @click="openCreate('inspiration')">新增灵感</t-button>
      </div>
      <div class="content-table">
        <div class="content-table__head">
          <span>内容信息</span>
          <span>补充信息</span>
          <span>操作</span>
        </div>
        <div v-for="item in adminStore.dataset.inspirations" :key="item.id" class="content-row">
          <div class="content-main">
            <img :src="item.cover" :alt="item.title" class="content-thumb" />
            <div>
              <div class="content-title">{{ item.title }}</div>
              <div class="content-meta">{{ item.subtitle }}</div>
            </div>
          </div>
          <div class="content-extra">{{ item.badge || '无角标' }}</div>
          <div class="content-actions">
            <t-link theme="primary" hover="color" @click="openEdit('inspiration', item)">编辑</t-link>
            <t-link theme="danger" hover="color" @click="removeCurrent('inspiration', item)">删除</t-link>
          </div>
        </div>
      </div>
    </t-card>

    <t-card class="admin-card">
      <div class="section-toolbar">
        <div class="section-title">文章与课程</div>
        <t-button theme="primary" @click="openCreate('article')">新增文章</t-button>
      </div>
      <div class="content-table">
        <div class="content-table__head">
          <span>内容信息</span>
          <span>补充信息</span>
          <span>操作</span>
        </div>
        <div v-for="item in adminStore.dataset.articles" :key="item.id" class="content-row">
          <div class="content-main">
            <img :src="item.cover" :alt="item.title" class="content-thumb" />
            <div>
              <div class="content-title">{{ item.title }}</div>
              <div class="content-meta">{{ item.author }}</div>
            </div>
          </div>
          <div class="content-extra">{{ item.publishTime }} · {{ item.views }} 阅读</div>
          <div class="content-actions">
            <t-link theme="primary" hover="color" @click="openEdit('article', item)">编辑</t-link>
            <t-link theme="danger" hover="color" @click="removeCurrent('article', item)">删除</t-link>
          </div>
        </div>
      </div>
    </t-card>

    <t-dialog
      v-model:visible="dialogVisible"
      :header="editingId ? '编辑内容' : '新增内容'"
      width="760px"
      confirm-btn="保存"
      cancel-btn="取消"
      @confirm="saveCurrent"
    >
      <div class="form-grid">
        <div class="field field-full">
          <span>标题</span>
          <t-input v-model="form.title" placeholder="请输入标题" />
        </div>
        <div v-if="currentType !== 'article'" class="field field-full">
          <span>副标题</span>
          <t-input v-model="form.subtitle" placeholder="请输入副标题" />
        </div>
        <div class="field field-full">
          <span>{{ currentType === 'banner' ? '图片 URL' : '封面图 URL' }}</span>
          <t-input v-model="form.image" placeholder="请输入图片链接" />
        </div>
        <div v-if="currentType === 'banner'" class="field">
          <span>角标</span>
          <t-input v-model="form.badge" placeholder="请输入角标文案" />
        </div>
        <div v-if="currentType === 'banner'" class="field">
          <span>按钮文案</span>
          <t-input v-model="form.buttonText" placeholder="请输入按钮文案" />
        </div>
        <div v-if="currentType === 'banner'" class="field field-full">
          <span>补充描述</span>
          <t-textarea v-model="form.description" :autosize="{ minRows: 3, maxRows: 5 }" placeholder="请输入描述" />
        </div>
        <div v-if="currentType === 'inspiration'" class="field">
          <span>角标</span>
          <t-input v-model="form.badge" placeholder="可选填写" />
        </div>
        <div v-if="currentType === 'article'" class="field">
          <span>作者</span>
          <t-input v-model="form.author" placeholder="请输入作者名称" />
        </div>
        <div v-if="currentType === 'article'" class="field">
          <span>发布时间</span>
          <t-input v-model="form.publishTime" placeholder="如：2026-05-13" />
        </div>
        <div v-if="currentType === 'article'" class="field field-full">
          <span>阅读数</span>
          <t-input-number v-model="form.views" theme="normal" :min="0" />
        </div>
      </div>
    </t-dialog>
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
  font-size: 18px;
  font-weight: 700;
}

.content-table {
  display: flex;
  flex-direction: column;
}

.content-table__head,
.content-row {
  display: grid;
  grid-template-columns: minmax(320px, 2fr) minmax(180px, 1fr) 120px;
  gap: 16px;
  align-items: center;
}

.content-table__head {
  padding: 0 16px 12px;
  color: var(--admin-text-soft);
  font-size: 12px;
  font-weight: 600;
}

.content-row {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(239, 228, 218, 0.72);
}

.content-row + .content-row {
  margin-top: 12px;
}

.content-main {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.content-thumb {
  width: 88px;
  height: 88px;
  border-radius: 18px;
  object-fit: cover;
  background: var(--admin-bg);
}

.content-title {
  font-weight: 700;
}

.content-meta {
  margin-top: 8px;
  color: var(--admin-text-soft);
  font-size: 13px;
}

.content-extra {
  color: var(--admin-text-soft);
  font-size: 13px;
  line-height: 1.7;
}

.content-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  justify-content: flex-end;
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
  .section-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .content-table__head {
    display: none;
  }

  .content-row {
    grid-template-columns: 1fr;
  }

  .content-actions {
    justify-content: flex-start;
  }
}
</style>

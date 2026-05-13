<script setup lang="ts">
import { reactive, watchEffect } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { useAdminStore } from '@/stores/admin';

const adminStore = useAdminStore();

const settings = reactive({
  appName: '',
  appSlogan: '',
  headlineTitle: '',
  headlineSubtitle: '',
});

watchEffect(() => {
  settings.appName = adminStore.dataset.app.name;
  settings.appSlogan = adminStore.dataset.app.slogan;
  settings.headlineTitle = adminStore.dataset.headline.title;
  settings.headlineSubtitle = adminStore.dataset.headline.subtitle;
});

async function save() {
  try {
    await adminStore.saveSettings(settings);
    MessagePlugin.success('站点设置已保存');
  } catch (error) {
    MessagePlugin.error(error instanceof Error ? error.message : '站点设置保存失败');
  }
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-grid-2">
      <t-card class="admin-card">
        <template #title>
          <div class="admin-section-title">站点信息</div>
        </template>
        <div class="form-grid">
          <div class="field">
            <span>品牌名称</span>
            <t-input v-model="settings.appName" />
          </div>
          <div class="field">
            <span>品牌 Slogan</span>
            <t-input v-model="settings.appSlogan" />
          </div>
          <div class="field field-full">
            <span>首页主标题</span>
            <t-input v-model="settings.headlineTitle" />
          </div>
          <div class="field field-full">
            <span>首页副标题</span>
            <t-input v-model="settings.headlineSubtitle" />
          </div>
        </div>
        <div class="actions">
          <t-button theme="primary" @click="save">保存站点设置</t-button>
        </div>
      </t-card>

      <t-card class="admin-card">
        <template #title>
          <div class="admin-section-title">联调说明</div>
        </template>
        <ul class="notes">
          <li>当前页面已接入真实后端接口，保存后会直接写入 MySQL。</li>
          <li>商品、分类、内容和订单模块与小程序展示数据保持同源。</li>
          <li>建议先在后台完成维护，再到小程序和接口页做结果验证。</li>
          <li>后续如果接入上传能力，可以把图片 URL 再替换为上传结果。</li>
        </ul>
      </t-card>
    </div>
  </div>
</template>

<style scoped>
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

.actions {
  margin-top: 18px;
}

.notes {
  margin: 0;
  padding-left: 20px;
  color: var(--admin-text-soft);
  line-height: 1.9;
}
</style>

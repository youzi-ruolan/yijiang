<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css';
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import AssetPickerDialog from '@/components/AssetPickerDialog.vue';
import { uploadAssetFileApi } from '@/api/admin';
import type { AssetItem } from '@/types';

const model = defineModel<string>({ default: '' });

const editorRef = shallowRef<IDomEditor>();
const videoPickerVisible = ref(false);

const toolbarConfig: Partial<IToolbarConfig> = {
  toolbarKeys: [
    'headerSelect',
    'bold',
    'italic',
    'underline',
    'through',
    'color',
    'bgColor',
    '|',
    'bulletedList',
    'numberedList',
    'justifyLeft',
    'justifyCenter',
    'justifyRight',
    '|',
    'insertLink',
    'blockquote',
    'divider',
    '|',
    'uploadImage',
    'insertVideo',
    '|',
    'undo',
    'redo',
  ],
};

const editorConfig: Partial<IEditorConfig> = {
  placeholder: '编写商品详情，支持文字、图片、视频，类似公众号图文排版',
  autoFocus: false,
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: (url: string, alt?: string, href?: string) => void) {
        try {
          const asset = await uploadAssetFileApi(file);
          insertFn(asset.url, asset.name, asset.url);
        } catch (error) {
          ElMessage.error(error instanceof Error ? error.message : '图片上传失败');
        }
      },
    },
    insertVideo: {
      checkVideo(_src: string) {
        return true;
      },
      parseVideoSrc(src: string) {
        return src.trim();
      },
    },
  },
};

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor;
  if (model.value) {
    editor.setHtml(model.value);
  }
}

function buildVideoHtml(asset: AssetItem) {
  const poster = asset.cover || '';
  return `<section class="mp-video-block" data-video-url="${asset.url}" data-video-poster="${poster}"><video src="${asset.url}" poster="${poster}" controls style="width:100%;max-width:100%;display:block;margin:12px 0;"></video></section>`;
}

function insertVideoFromAssets(assets: AssetItem[]) {
  const editor = editorRef.value;
  if (!editor) return;

  const videos = assets.filter((item) => item.type === 'video');
  if (!videos.length) {
    ElMessage.warning('请选择视频文件');
    return;
  }

  videos.forEach((asset) => {
    editor.dangerouslyInsertHtml(buildVideoHtml(asset));
  });
  model.value = editor.getHtml();
}

watch(
  () => model.value,
  (value) => {
    const editor = editorRef.value;
    if (!editor) return;
    if (value !== editor.getHtml()) {
      editor.setHtml(value || '');
    }
  },
);

onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor) {
    editor.destroy();
  }
});
</script>

<template>
  <div class="mp-rich-editor">
    <div class="mp-rich-editor__toolbar">
      <Toolbar :editor="editorRef" :default-config="toolbarConfig" mode="default" />
      <el-button size="small" type="primary" plain @click="videoPickerVisible = true">从资源库插入视频</el-button>
    </div>
    <Editor
      v-model="model"
      class="mp-rich-editor__body"
      :default-config="editorConfig"
      mode="default"
      @on-created="handleCreated"
    />
    <AssetPickerDialog
      v-model:visible="videoPickerVisible"
      title="选择视频插入详情"
      mode="multiple"
      asset-type="video"
      @confirm="insertVideoFromAssets"
    />
  </div>
</template>

<style scoped>
.mp-rich-editor {
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius-md);
  overflow: hidden;
  background: #fff;
}

.mp-rich-editor__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-right: 8px;
  border-bottom: 1px solid var(--admin-line);
}

.mp-rich-editor__toolbar :deep(.w-e-toolbar) {
  flex: 1;
  border: none !important;
}

.mp-rich-editor__body {
  min-height: 320px;
  overflow-y: auto;
}

.mp-rich-editor__body :deep(.w-e-text-container) {
  min-height: 320px !important;
}
</style>

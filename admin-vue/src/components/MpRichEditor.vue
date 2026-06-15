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

function escapeAttr(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function buildVideoHtml(url: string, poster = '', label = '视频') {
  const safeUrl = escapeAttr(url);
  const safePoster = escapeAttr(poster);
  const safeLabel = escapeAttr(label);
  return `<section class="mp-video-block" data-video-url="${safeUrl}" data-video-poster="${safePoster}"><p style="margin:12px 0;text-align:center;color:#8a7b70;">[${safeLabel}]</p></section><p><br></p>`;
}

function buildVideoHtmlFromAsset(asset: AssetItem) {
  return buildVideoHtml(asset.url, asset.cover || '', asset.name || '视频');
}

function releaseEditorSelection(editor: IDomEditor) {
  model.value = editor.getHtml();
  setTimeout(() => {
    editor.focus(true);
  }, 0);
}

const editorConfig: Partial<IEditorConfig> = {
  placeholder:
    '编写商品详情，支持文字、图片、视频。直链 mp4 可在小程序内播放；哔哩哔哩等外链会以卡片形式展示。',
  autoFocus: false,
  hoverbarKeys: {
    video: {
      menuKeys: [],
    },
  },
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: (url: string, alt?: string, href?: string) => void) {
        try {
          const asset = await uploadAssetFileApi(file);
          insertFn(asset.url, asset.name, asset.url);
          const editor = editorRef.value;
          if (editor) {
            editor.dangerouslyInsertHtml('<p><br></p>');
            releaseEditorSelection(editor);
          }
        } catch (error) {
          ElMessage.error(error instanceof Error ? error.message : '图片上传失败');
        }
      },
    },
    insertVideo: {
      checkVideo(src: string) {
        return !!src.trim();
      },
      parseVideoSrc(src: string) {
        return src.trim();
      },
      customInsert(video: string) {
        const editor = editorRef.value;
        if (!editor) return;

        const url = video.trim();
        if (!url) return;

        editor.dangerouslyInsertHtml(buildVideoHtml(url));
        releaseEditorSelection(editor);
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

function insertVideoFromAssets(assets: AssetItem[]) {
  const editor = editorRef.value;
  if (!editor) return;

  const videos = assets.filter((item) => item.type === 'video');
  if (!videos.length) {
    ElMessage.warning('请选择视频文件');
    return;
  }

  videos.forEach((asset) => {
    editor.dangerouslyInsertHtml(buildVideoHtmlFromAsset(asset));
  });
  releaseEditorSelection(editor);
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
    <p class="mp-rich-editor__hint">小程序内可直接播放 COS 的 mp4 视频；哔哩哔哩等页面链接会以「外链视频」卡片展示。</p>
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

.mp-rich-editor__hint {
  margin: 0;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--admin-text-soft);
  background: var(--admin-bg-soft);
  border-bottom: 1px solid var(--admin-line);
}

.mp-rich-editor__body {
  min-height: 320px;
  overflow-y: auto;
}

.mp-rich-editor__body :deep(.w-e-text-container) {
  min-height: 320px !important;
}

.mp-rich-editor__body :deep(.mp-video-block) {
  margin: 12px 0;
  padding: 12px;
  border: 1px dashed var(--admin-line);
  border-radius: 8px;
  background: var(--admin-bg-soft);
}
</style>

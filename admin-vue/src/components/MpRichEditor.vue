<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css';
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import AssetPickerDialog from '@/components/AssetPickerDialog.vue';
import { uploadAssetFileApi } from '@/api/admin';
import { isDirectVideoUrl } from '@/utils/video-cover';
import type { AssetItem } from '@/types';

const model = defineModel<string>({ default: '' });

const editorRef = shallowRef<IDomEditor>();
const imagePickerVisible = ref(false);
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

function resolveVideoMimeType(url: string) {
  if (/\.webm(\?|#|$)/i.test(url)) return 'video/webm';
  if (/\.mov(\?|#|$)/i.test(url)) return 'video/quicktime';
  if (/\.m4v(\?|#|$)/i.test(url)) return 'video/mp4';
  return 'video/mp4';
}

/** wangEditor v5 只识别 data-w-e-type="video" 包裹的视频节点 */
function buildEditorVideoHtml(url: string, poster = '') {
  const safeUrl = escapeAttr(url);
  const safePoster = escapeAttr(poster);
  const mimeType = resolveVideoMimeType(url);
  const posterAttr = safePoster ? ` poster="${safePoster}"` : '';
  const videoStyle =
    'width:100%;max-width:100%;min-height:200px;display:block;margin:0 auto;background:#101820;object-fit:contain;border-radius:8px;';

  return `<div data-w-e-type="video" data-w-e-is-void data-w-e-url="${safeUrl}" data-w-e-poster="${safePoster}"><video controls="true" width="100%" height="auto"${posterAttr} style="${videoStyle}"><source src="${safeUrl}" type="${mimeType}"/></video></div><p><br></p>`;
}

function buildExternalVideoHtml(url: string, poster = '', label = '视频') {
  const safeUrl = escapeAttr(url);
  const safePoster = escapeAttr(poster);
  const safeLabel = escapeAttr(label);

  return `<section class="mp-video-block" contenteditable="false" data-video-url="${safeUrl}" data-video-poster="${safePoster}"><p style="margin:12px 0;text-align:center;color:#8a7b70;">[外链视频] ${safeLabel}</p></section><p><br></p>`;
}

function buildVideoHtml(url: string, poster = '', label = '视频') {
  if (isDirectVideoUrl(url)) {
    return buildEditorVideoHtml(url, poster);
  }

  return buildExternalVideoHtml(url, poster, label);
}

function buildImageHtml(url: string, alt = '图片') {
  const safeUrl = escapeAttr(url);
  const safeAlt = escapeAttr(alt);
  return `<p><img src="${safeUrl}" alt="${safeAlt}" data-href="${safeUrl}" style="max-width:100%;display:block;margin:12px auto;border-radius:8px;" /></p>`;
}

function normalizeLegacyVideoHtml(html: string) {
  if (!html) return '';

  return html.replace(
    /<section[^>]*class=["'][^"']*mp-video-block[^"']*["'][^>]*data-video-url=["']([^"']+)["'][^>]*(?:data-video-poster=["']([^"']*)["'])?[^>]*>[\s\S]*?<\/section>/gi,
    (_segment, url: string, poster = '') => buildVideoHtml(url, poster),
  );
}

function insertVideoIntoEditor(
  editor: IDomEditor,
  url: string,
  poster = '',
  label = '视频',
  insertFn?: (videoUrl: string, videoPoster?: string) => void,
) {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return;

  if (isDirectVideoUrl(trimmedUrl)) {
    if (poster || !insertFn) {
      editor.dangerouslyInsertHtml(buildEditorVideoHtml(trimmedUrl, poster));
      return;
    }
    insertFn(trimmedUrl, '');
    return;
  }

  editor.dangerouslyInsertHtml(buildExternalVideoHtml(trimmedUrl, poster, label));
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
      customInsert(video: string, insertFn: (videoUrl: string, videoPoster?: string) => void) {
        const editor = editorRef.value;
        if (!editor) return;

        insertVideoIntoEditor(editor, video, '', '视频', insertFn);
        releaseEditorSelection(editor);
      },
    },
  },
};

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor;
  if (model.value) {
    editor.setHtml(normalizeLegacyVideoHtml(model.value));
  }
}

function insertImagesFromAssets(assets: AssetItem[]) {
  const editor = editorRef.value;
  if (!editor) return;

  const images = assets.filter((item) => item.type === 'image');
  if (!images.length) {
    ElMessage.warning('请选择图片文件');
    return;
  }

  images.forEach((asset) => {
    editor.dangerouslyInsertHtml(buildImageHtml(asset.url, asset.name || '图片'));
  });
  releaseEditorSelection(editor);
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
    insertVideoIntoEditor(editor, asset.url, asset.cover || '', asset.name || '视频');
  });
  releaseEditorSelection(editor);
}

watch(
  () => model.value,
  (value) => {
    const editor = editorRef.value;
    if (!editor) return;
    if (value !== editor.getHtml()) {
      editor.setHtml(normalizeLegacyVideoHtml(value || ''));
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
      <div class="mp-rich-editor__asset-actions">
        <el-button size="small" type="primary" plain @click="imagePickerVisible = true">从资源库插入图片</el-button>
        <el-button size="small" type="primary" plain @click="videoPickerVisible = true">从资源库插入视频</el-button>
      </div>
    </div>
    <p class="mp-rich-editor__hint">支持本地上传或从资源库选用图片/视频；COS 直链 mp4 可在小程序内播放，外链视频以卡片展示。</p>
    <Editor
      v-model="model"
      class="mp-rich-editor__body"
      :default-config="editorConfig"
      mode="default"
      @on-created="handleCreated"
    />
    <AssetPickerDialog
      v-model:visible="imagePickerVisible"
      title="选择图片插入详情"
      mode="multiple"
      asset-type="image"
      @confirm="insertImagesFromAssets"
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
  flex-wrap: wrap;
}

.mp-rich-editor__asset-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
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

.mp-rich-editor__body :deep(.mp-video-block),
.mp-rich-editor__body :deep(div[data-w-e-type='video']) {
  margin: 12px 0;
}

/* wangEditor 默认棋盘格占位，改为正常视频预览 */
.mp-rich-editor__body :deep(.w-e-textarea-video-container) {
  width: 100% !important;
  max-width: 100%;
  margin: 12px 0 !important;
  padding: 0 !important;
  border: 1px dashed var(--admin-line) !important;
  border-radius: 8px !important;
  background: #101820 !important;
  background-image: none !important;
  overflow: hidden;
  text-align: left !important;
  line-height: 0;
}

.mp-rich-editor__body :deep(.w-e-textarea-video-container video) {
  width: 100% !important;
  min-height: 200px;
  max-height: 420px;
  display: block !important;
  background: #101820 !important;
  object-fit: contain;
  border-radius: 8px;
  vertical-align: top;
}

.mp-rich-editor__body :deep(div[data-w-e-type='video'] video) {
  width: 100%;
  min-height: 200px;
  max-height: 420px;
  display: block;
  border-radius: 8px;
  background: #101820;
  object-fit: contain;
}

.mp-rich-editor__body :deep(.mp-video-block__player) {
  position: relative;
  width: 100%;
  min-height: 180px;
  border-radius: 8px;
  overflow: hidden;
  background: #101820;
}

.mp-rich-editor__body :deep(.mp-video-block video) {
  width: 100%;
  min-height: 180px;
  max-height: 420px;
  display: block;
  border-radius: 8px;
  background: transparent;
  object-fit: contain;
}
</style>

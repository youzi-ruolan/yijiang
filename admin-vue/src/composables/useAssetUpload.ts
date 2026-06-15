import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { uploadAssetFileApi, updateAssetApi, mapAssetFromApi } from '@/api/admin';
import { useAdminStore } from '@/stores/admin';
import { captureVideoCover, inspectVideoFile } from '@/utils/video-cover';
import type { AssetItem, AssetType } from '@/types';

const maxImageSize = 20 * 1024 * 1024;
const maxVideoSize = 500 * 1024 * 1024;

function resolveFileType(file: File): AssetType | null {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) return 'image';
  if (['mp4', 'mov', 'm4v', 'webm'].includes(extension)) return 'video';

  return null;
}

function validateUploadFile(file: File, type: AssetType) {
  if (type === 'image' && file.size > maxImageSize) {
    ElMessage.warning('图片不能超过 20MB');
    return false;
  }

  if (type === 'video' && file.size > maxVideoSize) {
    ElMessage.warning('视频不能超过 500MB');
    return false;
  }

  return true;
}

export function useAssetUpload() {
  const adminStore = useAdminStore();
  const uploading = ref(false);
  const uploadProgress = ref('');
  const recentUploads = ref<AssetItem[]>([]);

  async function uploadFile(file: File): Promise<AssetItem | null> {
    const type = resolveFileType(file);
    if (!type) {
      ElMessage.warning('仅支持图片 jpg/jpeg/png/webp/gif 或视频 mp4/mov/m4v/webm');
      return null;
    }

    if (!validateUploadFile(file, type)) {
      return null;
    }

    if (type === 'video') {
      uploadProgress.value = `正在检测 ${file.name}...`;
      const inspection = await inspectVideoFile(file);
      if (!inspection.ok) {
        ElMessage.error(inspection.message);
        uploading.value = false;
        uploadProgress.value = '';
        return null;
      }
    }

    uploading.value = true;
    uploadProgress.value = `正在上传 ${file.name}...`;

    try {
      const asset = await uploadAssetFileApi(file);
      let nextAsset = asset;

      if (type === 'video' && !asset.cover) {
        uploadProgress.value = `正在为 ${file.name} 生成封面...`;
        try {
          const dataUrl = await captureVideoCover(file);
          const blob = await fetch(dataUrl).then((response) => response.blob());
          const coverFile = new File(
            [blob],
            `${file.name.replace(/\.[^.]+$/, '')}-cover.jpg`,
            { type: 'image/jpeg' },
          );
          const coverAsset = await uploadAssetFileApi(coverFile);
          const updated = await updateAssetApi(asset.id, {
            ...asset,
            cover: coverAsset.url,
            tags: asset.tags || [],
          });
          nextAsset = mapAssetFromApi(updated);
        } catch {
          // 封面生成失败时仍保留视频本身
        }
      }

      adminStore.registerAsset(nextAsset);
      recentUploads.value = [nextAsset, ...recentUploads.value.filter((item) => item.id !== nextAsset.id)].slice(0, 6);
      return nextAsset;
    } catch (error) {
      const message = error instanceof Error ? error.message : '文件上传失败';
      if (message.includes('COS 上传配置不完整')) {
        ElMessage.error('服务端 COS 未配置，请在 server/.env 填写 TENCENT_COS_SECRET_ID 和 TENCENT_COS_SECRET_KEY');
      } else {
        ElMessage.error(message);
      }
      return null;
    } finally {
      uploading.value = false;
      uploadProgress.value = '';
    }
  }

  async function uploadFiles(files: File[]): Promise<AssetItem[]> {
    const results: AssetItem[] = [];

    for (const file of files) {
      const asset = await uploadFile(file);
      if (asset) {
        results.push(asset);
      }
    }

    if (results.length) {
      ElMessage.success(`已成功上传 ${results.length} 个文件`);
    }

    return results;
  }

  function clearRecentUploads() {
    recentUploads.value = [];
  }

  return {
    uploading,
    uploadProgress,
    recentUploads,
    uploadFile,
    uploadFiles,
    clearRecentUploads,
    resolveFileType,
  };
}

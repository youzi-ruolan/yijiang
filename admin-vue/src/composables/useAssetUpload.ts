import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { createAssetUploadSignatureApi } from '@/api/admin';
import { useAdminStore } from '@/stores/admin';
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

function getFileNameWithoutExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '');
}

export function useAssetUpload() {
  const adminStore = useAdminStore();
  const uploading = ref(false);
  const uploadProgress = ref('');

  async function uploadFile(file: File): Promise<AssetItem | null> {
    const type = resolveFileType(file);
    if (!type) {
      ElMessage.warning('仅支持图片 jpg/jpeg/png/webp/gif 或视频 mp4/mov/m4v/webm');
      return null;
    }

    if (!validateUploadFile(file, type)) {
      return null;
    }

    uploading.value = true;
    uploadProgress.value = `正在上传 ${file.name}...`;

    try {
      const signature = await createAssetUploadSignatureApi({
        fileName: file.name,
        type,
        mimeType: file.type || undefined,
      });

      const response = await fetch(signature.uploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: signature.authorization,
          'Content-Type': signature.contentType,
        },
        body: file,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `COS 上传失败：${response.status}`);
      }

      const asset: AssetItem = {
        id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: getFileNameWithoutExtension(file.name),
        type,
        url: signature.publicUrl,
        cover: '',
        description: `上传文件：${file.name}`,
        tags: [],
        sort: 0,
        status: 'ACTIVE',
      };

      await adminStore.upsertAsset(asset);
      return asset;
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

  return {
    uploading,
    uploadProgress,
    uploadFile,
    uploadFiles,
    resolveFileType,
  };
}

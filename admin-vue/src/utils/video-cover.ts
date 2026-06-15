function seekVideoFrame(video: HTMLVideoElement, seekTime = 0.05): number {
  const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
  if (duration <= 0) return 0;
  if (duration <= seekTime + 0.05) return 0;
  return Math.min(seekTime, duration - 0.01);
}

function captureFrameFromVideo(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  const width = video.videoWidth || 640;
  const height = video.videoHeight || 360;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法生成封面');
  }
  ctx.drawImage(video, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.84);
}

function waitForVideoFrame(video: HTMLVideoElement, seekTime = 0.05): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('视频读取超时'));
    }, 15000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener('error', onError);
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('seeked', onSeeked);
    };

    const onError = () => {
      cleanup();
      reject(new Error('视频读取失败'));
    };

    const onSeeked = () => {
      try {
        const dataUrl = captureFrameFromVideo(video);
        cleanup();
        resolve(dataUrl);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    const onMetadata = () => {
      video.currentTime = seekVideoFrame(video, seekTime);
    };

    video.addEventListener('error', onError);
    video.addEventListener('loadedmetadata', onMetadata, { once: true });
    video.addEventListener('seeked', onSeeked, { once: true });
    video.load();
  });
}

export function captureVideoCover(file: File, seekTime = 0.05): Promise<string> {
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;

  return waitForVideoFrame(video, seekTime).finally(() => {
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute('src');
    video.load();
  });
}

export function captureVideoCoverFromUrl(url: string, seekTime = 0.05): Promise<string> {
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';
  video.src = url;

  return waitForVideoFrame(video, seekTime).finally(() => {
    video.removeAttribute('src');
    video.load();
  });
}

export function isDirectVideoUrl(url: string) {
  return /\.(mp4|mov|m4v|webm|m3u8)(\?|#|$)/i.test(url);
}

const HEVC_MARKERS = ['hvc1', 'hev1', 'hevc', 'HEVC', 'hvcC'];

export function detectHevcInVideoFile(file: File): Promise<boolean> {
  const sample = file.slice(0, Math.min(file.size, 2 * 1024 * 1024));
  return sample.arrayBuffer().then((buffer) => {
    const text = new TextDecoder('latin1').decode(buffer);
    return HEVC_MARKERS.some((marker) => text.includes(marker));
  });
}

export function inspectVideoFile(file: File): Promise<{ ok: true } | { ok: false; message: string }> {
  return detectHevcInVideoFile(file).then((isHevc) => {
    if (isHevc) {
      return {
        ok: false,
        message:
          '检测到 H.265/HEVC 编码。浏览器和小程序无法正常播放，画面会全黑。请用剪映、格式工厂等工具导出为 H.264 编码的 MP4 后重新上传。',
      };
    }

    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      const objectUrl = URL.createObjectURL(file);

      const timeout = window.setTimeout(() => {
        cleanup();
        resolve({
          ok: false,
          message: '视频预览超时，请确认文件未损坏，并优先使用 H.264 编码的 MP4。',
        });
      }, 12000);

      const cleanup = () => {
        window.clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);
        video.removeAttribute('src');
        video.load();
      };

      video.addEventListener('error', () => {
        cleanup();
        resolve({
          ok: false,
          message: '视频无法在本机预览，请确认文件未损坏，并导出为 H.264 编码的 MP4。',
        });
      });

      video.addEventListener('loadeddata', () => {
        const hasFrame = video.videoWidth > 0 && video.videoHeight > 0;
        cleanup();
        if (!hasFrame) {
          resolve({
            ok: false,
            message:
              '视频没有可解码的画面（常见于 H.265/HEVC）。请导出为 H.264 编码的 MP4 后重新上传。',
          });
          return;
        }
        resolve({ ok: true });
      });

      video.src = objectUrl;
      video.load();
    });
  });
}

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

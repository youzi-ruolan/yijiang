<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { VideoPlay } from '@element-plus/icons-vue';

const props = withDefaults(
  defineProps<{
    src: string;
    cover?: string;
    compact?: boolean;
    playOnButton?: boolean;
  }>(),
  {
    cover: '',
    compact: false,
    playOnButton: true,
  },
);

const videoRef = ref<HTMLVideoElement | null>(null);
const playing = ref(false);
const poster = ref(props.cover);
const frameReady = ref(false);
const loadError = ref(false);
const durationText = ref('');

watch(
  () => props.cover,
  (value) => {
    poster.value = value || '';
    frameReady.value = !!value;
  },
);

watch(
  () => props.src,
  () => {
    loadError.value = false;
    frameReady.value = !!poster.value;
    durationText.value = '';
    playing.value = false;
  },
);

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const remain = total % 60;
  return minutes > 0 ? `${minutes}:${`${remain}`.padStart(2, '0')}` : `0:${`${remain}`.padStart(2, '0')}`;
}

function primeFirstFrame() {
  const video = videoRef.value;
  if (!video || poster.value || playing.value) return;

  const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
  const target = duration > 0.15 ? 0.05 : 0;

  if (Math.abs(video.currentTime - target) < 0.01 && video.videoWidth > 0) {
    frameReady.value = true;
    return;
  }

  video.currentTime = target;
}

function handleLoadedMetadata() {
  const video = videoRef.value;
  if (!video) return;

  durationText.value = formatDuration(video.duration);
  if (!poster.value) {
    primeFirstFrame();
  }
}

function handleSeeked() {
  const video = videoRef.value;
  if (!video || poster.value || playing.value) return;
  if (video.videoWidth > 0) {
    frameReady.value = true;
  }
}

function handleError() {
  loadError.value = true;
  frameReady.value = false;
}

async function togglePlay(event?: Event) {
  event?.stopPropagation();

  const video = videoRef.value;
  if (!video || loadError.value) return;

  if (video.paused) {
    if (video.currentTime <= 0.05 && video.duration > 0.1) {
      video.currentTime = 0;
    }
    try {
      await video.play();
      playing.value = true;
    } catch {
      playing.value = false;
    }
    return;
  }

  video.pause();
  playing.value = false;
}

function handlePause() {
  playing.value = false;
  if (!poster.value) {
    primeFirstFrame();
  }
}

function handlePreviewClick(event: MouseEvent) {
  if (props.playOnButton) {
    return;
  }
  togglePlay(event);
}

onBeforeUnmount(() => {
  videoRef.value?.pause();
});
</script>

<template>
  <div
    class="video-preview"
    :class="{
      'video-preview--compact': compact,
      'video-preview--playing': playing,
      'video-preview--frame-ready': frameReady || playing,
    }"
  >
    <video
      ref="videoRef"
      class="video-preview__media"
      :src="src"
      :poster="poster || undefined"
      :preload="poster ? 'metadata' : 'auto'"
      playsinline
      :controls="playing"
      @loadedmetadata="handleLoadedMetadata"
      @seeked="handleSeeked"
      @pause="handlePause"
      @ended="handlePause"
      @error="handleError"
      @click="handlePreviewClick"
    />
    <img v-if="poster && !playing" class="video-preview__poster" :src="poster" alt="视频封面" />
    <div v-if="loadError" class="video-preview__error">视频无法预览</div>
    <span v-else-if="durationText && !playing" class="video-preview__duration">{{ durationText }}</span>
    <button
      v-if="!playing && !loadError"
      type="button"
      class="video-preview__play"
      aria-label="播放视频"
      @click="togglePlay"
    >
      <el-icon><VideoPlay /></el-icon>
    </button>
  </div>
</template>

<style scoped>
.video-preview {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #101820;
}

.video-preview__media {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  background: #101820;
  opacity: 0;
  transition: opacity 0.15s;
}

.video-preview--frame-ready .video-preview__media,
.video-preview--playing .video-preview__media {
  opacity: 1;
}

.video-preview__poster {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.video-preview__error {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #c9b8ad;
  font-size: 12px;
  padding: 8px;
  text-align: center;
}

.video-preview__duration {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 11px;
  line-height: 1.4;
  z-index: 1;
}

.video-preview__play {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border: none;
  cursor: pointer;
  z-index: 2;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 24px;
  transition: background 0.15s, transform 0.15s;
}

.video-preview--compact .video-preview__play {
  width: 42px;
  height: 42px;
  font-size: 20px;
}

.video-preview__play:hover {
  background: rgba(0, 0, 0, 0.72);
  transform: translate(-50%, -50%) scale(1.04);
}

.video-preview--playing .video-preview__media {
  object-fit: contain;
  background: #000;
}
</style>

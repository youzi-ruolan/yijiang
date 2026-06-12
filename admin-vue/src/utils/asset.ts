import type { AssetItem } from '@/types';

export function assetToGalleryLine(asset: AssetItem): string {
  if (asset.type === 'image') {
    return asset.url;
  }

  return JSON.stringify({
    type: 'video',
    url: asset.url,
    cover: asset.cover || '',
    title: asset.name,
  });
}

export function parseGalleryLine(line: string): { type: 'image' | 'video'; url: string; cover?: string; title?: string } {
  const trimmed = line.trim();
  if (!trimmed) {
    return { type: 'image', url: '' };
  }

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as { type?: string; url?: string; cover?: string; title?: string };
      if (parsed.type === 'video' && parsed.url) {
        return {
          type: 'video',
          url: parsed.url,
          cover: parsed.cover,
          title: parsed.title,
        };
      }
    } catch {
      // fall through as image url
    }
  }

  return { type: 'image', url: trimmed };
}

export function galleryTextToLines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function galleryLinesToText(lines: string[]): string {
  return lines.join('\n');
}

export function getGalleryPreviewUrl(line: string): string {
  const parsed = parseGalleryLine(line);
  if (parsed.type === 'video') {
    return parsed.cover || '';
  }

  return parsed.url;
}

/**
 * 将商品详情 HTML 解析为小程序可渲染的块列表（文字/图片用 rich-text，视频用 video 组件）
 * 兼容 wangEditor 输出的 video 节点与自定义 mp-video-block
 */
function extractVideoMeta(segment) {
  const urlMatch =
    segment.match(/data-video-url=["']([^"']+)["']/i) ||
    segment.match(/data-w-e-url=["']([^"']+)["']/i) ||
    segment.match(/<source[^>]+src=["']([^"']+)["']/i) ||
    segment.match(/<video[^>]+src=["']([^"']+)["']/i);

  const posterMatch =
    segment.match(/data-video-poster=["']([^"']+)["']/i) ||
    segment.match(/data-w-e-poster=["']([^"']+)["']/i) ||
    segment.match(/poster=["']([^"']+)["']/i);

  const url = urlMatch ? urlMatch[1] : '';
  if (!url) return null;

  return {
    type: 'video',
    url,
    poster: posterMatch ? posterMatch[1] : '',
  };
}

function normalizeRichHtml(html) {
  const trimmed = `${html || ''}`.trim();
  if (!trimmed) return '';

  return trimmed
    .replace(/<img([^>]*?)(?:\s*\/)?>/gi, (match, attrs) => {
      if (/style=/i.test(attrs)) {
        return `<img${attrs}>`;
      }
      return `<img${attrs} style="max-width:100%;height:auto;display:block;margin:12px 0;">`;
    })
    .replace(/<p><br><\/p>/gi, '<p style="margin:8px 0;"></p>');
}

const VIDEO_SPLIT_RE =
  /(<section[^>]*class=["'][^"']*mp-video-block[^"']*["'][^>]*>[\s\S]*?<\/section>|<div[^>]*data-w-e-type=["']video["'][^>]*>[\s\S]*?<\/div>|<video[\s\S]*?<\/video>)/gi;

export function parseDetailContentHtml(html) {
  const source = `${html || ''}`.trim();
  if (!source) return [];

  const blocks = [];
  let lastIndex = 0;
  let match;

  VIDEO_SPLIT_RE.lastIndex = 0;
  while ((match = VIDEO_SPLIT_RE.exec(source)) !== null) {
    const richPart = source.slice(lastIndex, match.index);
    const richHtml = normalizeRichHtml(richPart);
    if (richHtml) {
      blocks.push({ type: 'rich', html: richHtml });
    }

    const videoMeta = extractVideoMeta(match[0]);
    if (videoMeta) {
      blocks.push(videoMeta);
    }

    lastIndex = match.index + match[0].length;
  }

  const tail = normalizeRichHtml(source.slice(lastIndex));
  if (tail) {
    blocks.push({ type: 'rich', html: tail });
  }

  return blocks;
}

export function detailContentToHtml(value) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => `<p>${`${item}`.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
      .join('');
  }

  return '';
}

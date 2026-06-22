/**
 * 将商品详情 HTML 解析为小程序可渲染的块列表（文字/图片用 rich-text，视频用 video 组件）
 * 兼容 wangEditor 输出的 video 节点与自定义 mp-video-block
 */

function isPlayableVideoUrl(url) {
  return /\.(mp4|mov|m4v|webm|m3u8)(\?|#|$)/i.test(url);
}

function isExternalVideoPage(url) {
  return /bilibili\.com|b23\.tv|youtube\.com|youtu\.be|v\.qq\.com|youku\.com/i.test(url);
}

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

  const poster = posterMatch ? posterMatch[1] : '';

  if (isPlayableVideoUrl(url)) {
    return {
      type: 'video',
      url,
      poster,
    };
  }

  return {
    type: 'external-video',
    url,
    poster,
    label: isExternalVideoPage(url) ? '外链视频' : '视频链接',
  };
}

function mergeInlineStyle(existing = '', additions = '') {
  const base = `${existing || ''}`.trim().replace(/;+\s*$/, '');
  const extra = `${additions || ''}`.trim().replace(/;+\s*$/, '');
  if (!base) return extra;
  if (!extra) return base;
  return `${base}; ${extra}`;
}

function upsertTagStyle(tagName, attrs, styleText) {
  const attrText = `${attrs || ''}`;
  if (/style=/i.test(attrText)) {
    return `<${tagName}${attrText.replace(/style=["']([^"']*)["']/i, (_match, styleValue) => {
      return `style="${mergeInlineStyle(styleValue, styleText)}"`;
    })}>`;
  }
  return `<${tagName}${attrText} style="${styleText}">`;
}

const RICH_TEXT_STYLES = {
  h1: 'margin:24px 0 12px;font-size:18px;line-height:1.45;font-weight:700;color:#1a1a1a;',
  h2: 'margin:22px 0 10px;font-size:17px;line-height:1.45;font-weight:700;color:#1a1a1a;',
  h3: 'margin:20px 0 8px;font-size:16px;line-height:1.5;font-weight:600;color:#222222;',
  h4: 'margin:18px 0 8px;font-size:15px;line-height:1.5;font-weight:600;color:#333333;',
  p: 'margin:12px 0;font-size:14px;line-height:1.85;color:#4a4a4a;',
  strong: 'font-weight:600;color:#222222;',
  b: 'font-weight:600;color:#222222;',
  li: 'margin:6px 0;font-size:14px;line-height:1.75;color:#4a4a4a;',
  ul: 'margin:10px 0;padding-left:18px;',
  ol: 'margin:10px 0;padding-left:18px;',
};

function applyRichTextTypography(html) {
  let next = `${html || ''}`;
  Object.keys(RICH_TEXT_STYLES).forEach((tag) => {
    const re = new RegExp(`<${tag}([^>]*)>`, 'gi');
    next = next.replace(re, (_match, attrs) => upsertTagStyle(tag, attrs, RICH_TEXT_STYLES[tag]));
  });
  return next;
}

function normalizeImgTag(attrs) {
  const forcedStyle = 'width:100%;height:auto;display:block;margin:16px 0;';
  let next = attrs
    .replace(/\s+width=["'][^"']*["']/gi, '')
    .replace(/\s+height=["'][^"']*["']/gi, '');

  if (/style=/i.test(next)) {
    next = next.replace(/style=["']([^"']*)["']/i, () => `style="${forcedStyle}"`);
  } else {
    next = `${next} style="${forcedStyle}"`;
  }

  return `<img${next}>`;
}

function normalizeRichHtml(html) {
  const trimmed = `${html || ''}`.trim();
  if (!trimmed) return '';

  return applyRichTextTypography(
    trimmed
      .replace(/<img([^>]*?)(?:\s*\/)?>/gi, (_match, attrs) => normalizeImgTag(attrs))
      .replace(/<p><br><\/p>/gi, '<p style="margin:8px 0;"></p>'),
  );
}

function splitRichHtmlParts(html) {
  const source = `${html || ''}`.trim();
  if (!source) return [];

  const parts = [];
  const imgRe = /<img[^>]+src=["']([^"']+)["'][^>]*\/?>/gi;
  let lastIndex = 0;
  let match;

  while ((match = imgRe.exec(source)) !== null) {
    const before = source.slice(lastIndex, match.index).trim();
    if (before) {
      parts.push({ type: 'rich', html: before });
    }
    parts.push({ type: 'image', url: match[1] });
    lastIndex = match.index + match[0].length;
  }

  const tail = source.slice(lastIndex).trim();
  if (tail) {
    parts.push({ type: 'rich', html: tail });
  }

  return parts.length ? parts : [{ type: 'rich', html: source }];
}

function pushRichParts(blocks, html) {
  const richHtml = normalizeRichHtml(html);
  if (!richHtml) return;

  splitRichHtmlParts(richHtml).forEach((part) => {
    blocks.push(part);
  });
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
    pushRichParts(blocks, richPart);

    const videoMeta = extractVideoMeta(match[0]);
    if (videoMeta) {
      blocks.push(videoMeta);
    }

    lastIndex = match.index + match[0].length;
  }

  pushRichParts(blocks, source.slice(lastIndex));

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

export function isDirectVideoUrl(url) {
  return isPlayableVideoUrl(url);
}

export function isExternalVideoUrl(url) {
  return isExternalVideoPage(url) || (!!url && !isPlayableVideoUrl(url));
}

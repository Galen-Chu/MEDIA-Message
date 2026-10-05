import type { MediaKind } from '../types';

/**
 * 以 File 的 MIME 類型辨識媒體類型;MIME 缺漏(部分瀏覽器/拖曳路徑)時以副檔名 fallback。
 * 純函式,供 M1 編輯器判定「可發佈媒體」與 UI 標示使用。
 */

const EXTENSION_KINDS: Record<string, MediaKind> = {
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  heic: 'image',
  heif: 'image',
  mp4: 'video',
  mov: 'video',
  m4v: 'video',
  webm: 'video',
  mp3: 'audio',
  wav: 'audio',
  m4a: 'audio',
  aac: 'audio',
};

export function detectMediaKind(mime: string, filename = ''): MediaKind {
  const normalized = mime.trim().toLowerCase();
  if (normalized.startsWith('image/')) return 'image';
  if (normalized.startsWith('video/')) return 'video';
  if (normalized.startsWith('audio/')) return 'audio';

  const dot = filename.lastIndexOf('.');
  if (dot >= 0 && dot + 1 < filename.length) {
    const ext = filename.slice(dot + 1).toLowerCase();
    if (EXTENSION_KINDS[ext]) return EXTENSION_KINDS[ext];
  }
  return 'other';
}

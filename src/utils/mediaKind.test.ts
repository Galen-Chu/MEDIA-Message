import { describe, expect, it } from 'vitest';
import { detectMediaKind } from './mediaKind';

describe('detectMediaKind', () => {
  it('以 MIME 前綴辨識圖片/影片/音檔', () => {
    expect(detectMediaKind('image/jpeg')).toBe('image');
    expect(detectMediaKind('image/png')).toBe('image');
    expect(detectMediaKind('video/mp4')).toBe('video');
    expect(detectMediaKind('video/quicktime')).toBe('video');
    expect(detectMediaKind('audio/mpeg')).toBe('audio');
  });

  it('MIME 大小寫與前後空白不影響結果', () => {
    expect(detectMediaKind('  IMAGE/WEBP ')).toBe('image');
    expect(detectMediaKind('Video/MP4')).toBe('video');
  });

  it('MIME 缺漏時以副檔名 fallback(含大寫與中文檔名)', () => {
    expect(detectMediaKind('', '假期照片.JPG')).toBe('image');
    expect(detectMediaKind('', '家庭影片.mov')).toBe('video');
    expect(detectMediaKind('', 'podcast EP3.mp3')).toBe('audio');
  });

  it('未知 MIME 且未知副檔名 → other', () => {
    expect(detectMediaKind('application/pdf')).toBe('other');
    expect(detectMediaKind('', '筆記.txt')).toBe('other');
    expect(detectMediaKind('', '無副檔名')).toBe('other');
    expect(detectMediaKind('')).toBe('other');
  });

  it('MIME 優先於副檔名(兩者衝突時)', () => {
    expect(detectMediaKind('video/mp4', '偽裝的圖片.png')).toBe('video');
  });

  it('僅點結尾(隱藏檔)不誤判為有副檔名', () => {
    expect(detectMediaKind('', '.gitignore')).toBe('other');
  });
});

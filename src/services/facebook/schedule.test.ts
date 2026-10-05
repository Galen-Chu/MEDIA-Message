import { describe, expect, it } from 'vitest';
import {
  PHOTO_SCHEDULE_MAX_DAYS,
  SCHEDULE_MIN_LEAD_MS,
  VIDEO_SCHEDULE_MAX_DAYS,
  toScheduleSeconds,
  validateScheduleTime,
} from './schedule';

const NOW = 1767225600000; // 固定基準,避免測試依賴牆鐘
const MIN = SCHEDULE_MIN_LEAD_MS;
const DAY = 24 * 60 * 60 * 1000;

describe('validateScheduleTime(平台原生排程時間窗)', () => {
  it('不到 10 分鐘 → schedule_window;恰好 10 分鐘可排', () => {
    expect(validateScheduleTime('image', NOW + MIN - 60_000, NOW)).toMatchObject({
      code: 'schedule_window',
    });
    expect(validateScheduleTime('video', NOW + MIN - 1, NOW)).toMatchObject({ code: 'schedule_window' });
    expect(validateScheduleTime('image', NOW + MIN, NOW)).toBeNull();
    expect(validateScheduleTime('video', NOW + MIN, NOW)).toBeNull();
  });

  it('圖片上限 75 天;影片上限 180 天(官方明載 6 個月)', () => {
    expect(validateScheduleTime('image', NOW + (PHOTO_SCHEDULE_MAX_DAYS - 1) * DAY, NOW)).toBeNull();
    expect(validateScheduleTime('image', NOW + (PHOTO_SCHEDULE_MAX_DAYS + 1) * DAY, NOW)).toMatchObject(
      { code: 'schedule_window' },
    );
    expect(validateScheduleTime('video', NOW + (VIDEO_SCHEDULE_MAX_DAYS - 1) * DAY, NOW)).toBeNull();
    expect(validateScheduleTime('video', NOW + (VIDEO_SCHEDULE_MAX_DAYS + 1) * DAY, NOW)).toMatchObject(
      { code: 'schedule_window' },
    );
  });

  it('過去/無效時間 → schedule_window', () => {
    expect(validateScheduleTime('image', NOW - DAY, NOW)).toMatchObject({ code: 'schedule_window' });
    expect(validateScheduleTime('video', Number.NaN, NOW)).toMatchObject({ code: 'schedule_window' });
  });
});

describe('toScheduleSeconds', () => {
  it('毫秒 → 秒(無條件捨去),字串型別對應文件 int64', () => {
    expect(toScheduleSeconds(1767225600123)).toBe('1767225600');
    expect(toScheduleSeconds(1767225600999)).toBe('1767225600');
  });
});

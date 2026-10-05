/**
 * 平台原生排程時間窗驗證(純邏輯;發佈前一律先驗,錯誤訊息見 constants.ts FB_ERROR_COPY)。
 * 依 2026-10-05 官方文件查證:
 * - 影片(Page Videos 建立參數明載):scheduled_publish_time 須在 10 分鐘~6 個月內
 *   https://developers.facebook.com/docs/graph-api/reference/page/videos/
 * - 圖片(Page Photos 參考文件未明載時間窗):下限沿用同一 10 分鐘規則;
 *   上限 75 天為文管庫 feed 排程實測經驗值(保守採用,伺服器為最終裁決)
 *   https://developers.facebook.com/docs/graph-api/reference/page/photos/
 */
import { FacebookError } from './errors';

export type ScheduleKind = 'image' | 'video';

/** 排程下限:至少 10 分鐘後(平台原生排程通用規則)。 */
export const SCHEDULE_MIN_LEAD_MS = 10 * 60 * 1000;

/** 圖片排程上限(天)。 */
export const PHOTO_SCHEDULE_MAX_DAYS = 75;

/** 影片排程上限(天)——官方明載 6 個月。 */
export const VIDEO_SCHEDULE_MAX_DAYS = 180;

/** 驗證排程時間;通過回 null,否則回 schedule_window 錯誤。 */
export function validateScheduleTime(
  kind: ScheduleKind,
  scheduledAtMs: number,
  nowMs: number = Date.now(),
): FacebookError | null {
  if (!Number.isFinite(scheduledAtMs)) {
    return new FacebookError('schedule_window', 'invalid time');
  }
  if (scheduledAtMs - nowMs < SCHEDULE_MIN_LEAD_MS) {
    return new FacebookError('schedule_window', `lead ${(scheduledAtMs - nowMs) / 60000} min < 10 min`);
  }
  const maxDays = kind === 'video' ? VIDEO_SCHEDULE_MAX_DAYS : PHOTO_SCHEDULE_MAX_DAYS;
  if (scheduledAtMs - nowMs > maxDays * 24 * 60 * 60 * 1000) {
    return new FacebookError('schedule_window', `window > ${maxDays} days`);
  }
  return null;
}

/** 排程時間 → Graph 參數秒值(文件型別 int64,Unix timestamp,秒)。 */
export function toScheduleSeconds(scheduledAtMs: number): string {
  return String(Math.floor(scheduledAtMs / 1000));
}

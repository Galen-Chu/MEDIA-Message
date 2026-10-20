/**
 * 媒管 Dashboard 統計(IA-D2):全部由發佈歷史 metadata 即時推導,不另存狀態。
 * 純函式、可注入時間,月邊界與排程判定均由單元測試釘住。
 */
import type { PublishRecord } from '../services/history';

export interface DashboardStats {
  /** 本月已生效發佈(立即=createdAt、排程=排定時間,落在本月且已到點)。 */
  publishedThisMonth: number;
  /** 尚未到排定時間的排程筆數。 */
  pendingSchedules: number;
  imageCount: number;
  videoCount: number;
}

export function computeDashboardStats(
  records: readonly PublishRecord[],
  nowMs: number,
): DashboardStats {
  const now = new Date(nowMs);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const stats: DashboardStats = {
    publishedThisMonth: 0,
    pendingSchedules: 0,
    imageCount: 0,
    videoCount: 0,
  };
  for (const r of records) {
    if (r.mediaKind === 'image') stats.imageCount += 1;
    if (r.mediaKind === 'video') stats.videoCount += 1;
    // 未到點的排程=待發,不計入已發佈
    if (r.mode === 'schedule' && r.scheduledFor !== null && r.scheduledFor > nowMs) {
      stats.pendingSchedules += 1;
      continue;
    }
    const effectiveAt = r.mode === 'schedule' && r.scheduledFor !== null ? r.scheduledFor : r.createdAt;
    if (effectiveAt >= monthStart && effectiveAt <= nowMs) stats.publishedThisMonth += 1;
  }
  return stats;
}

export interface UpcomingSchedule {
  id: string;
  mediaName: string;
  scheduledFor: number;
  caption: string;
}

/** 近期排程:未來排程升冪取前 limit 筆(Dashboard 卡)。 */
export function upcomingSchedules(
  records: readonly PublishRecord[],
  nowMs: number,
  limit = 3,
): UpcomingSchedule[] {
  return records
    .flatMap((r) =>
      r.mode === 'schedule' && r.scheduledFor !== null && r.scheduledFor > nowMs
        ? [{ id: r.id, mediaName: r.mediaName, scheduledFor: r.scheduledFor, caption: r.caption }]
        : [],
    )
    .sort((a, b) => a.scheduledFor - b.scheduledFor)
    .slice(0, limit);
}

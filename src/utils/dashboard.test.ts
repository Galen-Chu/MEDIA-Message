import { describe, expect, it } from 'vitest';
import { computeDashboardStats, upcomingSchedules } from './dashboard';
import type { PublishRecord } from '../services/history';

const NOW = new Date(2026, 9, 20, 12, 0).getTime(); // 2026-10-20 12:00;本月起點=2026-10-01
const MONTH_START = new Date(2026, 9, 1).getTime();
const LAST_MONTH = new Date(2026, 8, 30).getTime();
const NEXT_MONTH = new Date(2026, 10, 1).getTime();

function rec(partial: Partial<PublishRecord>): PublishRecord {
  return {
    id: partial.id ?? crypto.randomUUID(),
    platform: 'facebook',
    mode: 'now',
    mediaName: 'photo.jpg',
    mediaKind: 'image',
    mediaSize: 1000,
    caption: '',
    createdAt: NOW,
    scheduledFor: null,
    postId: null,
    ...partial,
  };
}

describe('computeDashboardStats', () => {
  it('本月已發佈:立即發佈以 createdAt 落在本月內才計入', () => {
    const stats = computeDashboardStats(
      [
        rec({ id: 'a', createdAt: NOW }),
        rec({ id: 'b', createdAt: LAST_MONTH }),
        rec({ id: 'c', createdAt: MONTH_START }), // 恰為 10-01 00:00:邊界內
        rec({ id: 'd', createdAt: NEXT_MONTH }),
      ],
      NOW,
    );
    expect(stats.publishedThisMonth).toBe(2);
  });

  it('排程記錄:未到點=待發且不計已發佈;已到點=計入已發佈(以排定時間判月份)', () => {
    const stats = computeDashboardStats(
      [
        rec({ id: 'a', mode: 'schedule', createdAt: LAST_MONTH, scheduledFor: NOW + 3600_000 }),
        rec({ id: 'b', mode: 'schedule', createdAt: LAST_MONTH, scheduledFor: NOW }), // 恰到點=due
        rec({ id: 'c', mode: 'schedule', createdAt: NOW, scheduledFor: NEXT_MONTH + 3600_000 }),
      ],
      NOW,
    );
    expect(stats.pendingSchedules).toBe(2); // a 與 c
    expect(stats.publishedThisMonth).toBe(1); // b(排定=NOW,本月內)
  });

  it('排程 scheduledFor=null(防禦式形狀)不會計入待發,退回以 createdAt 判定', () => {
    const stats = computeDashboardStats(
      [rec({ id: 'a', mode: 'schedule', scheduledFor: null, createdAt: NOW })],
      NOW,
    );
    expect(stats.pendingSchedules).toBe(0);
    expect(stats.publishedThisMonth).toBe(1);
  });

  it('媒體類型計數:image/video 各自累加,audio/other 不計入兩卡', () => {
    const stats = computeDashboardStats(
      [
        rec({ id: 'a', mediaKind: 'image' }),
        rec({ id: 'b', mediaKind: 'image' }),
        rec({ id: 'c', mediaKind: 'video' }),
        rec({ id: 'd', mediaKind: 'audio' }),
        rec({ id: 'e', mediaKind: 'other' }),
      ],
      NOW,
    );
    expect(stats.imageCount).toBe(2);
    expect(stats.videoCount).toBe(1);
  });

  it('空記錄全零', () => {
    expect(computeDashboardStats([], NOW)).toEqual({
      publishedThisMonth: 0,
      pendingSchedules: 0,
      imageCount: 0,
      videoCount: 0,
    });
  });
});

describe('upcomingSchedules', () => {
  it('未來排程升冪排列,只取欄位子集', () => {
    const list = upcomingSchedules(
      [
        rec({ id: 'late', mode: 'schedule', scheduledFor: NOW + 7200_000, mediaName: 'b.mp4' }),
        rec({ id: 'soon', mode: 'schedule', scheduledFor: NOW + 1800_000, mediaName: 'a.jpg' }),
      ],
      NOW,
    );
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ id: 'soon', mediaName: 'a.jpg' });
    expect(list[1]).toMatchObject({ id: 'late', mediaName: 'b.mp4' });
  });

  it('排除立即發佈、已到點排程與 scheduledFor=null;limit 截斷', () => {
    const list = upcomingSchedules(
      [
        rec({ id: 'now', mode: 'now' }),
        rec({ id: 'past', mode: 'schedule', scheduledFor: NOW - 1000 }),
        rec({ id: 'null', mode: 'schedule', scheduledFor: null }),
        rec({ id: 'f1', mode: 'schedule', scheduledFor: NOW + 1000 }),
        rec({ id: 'f2', mode: 'schedule', scheduledFor: NOW + 2000 }),
        rec({ id: 'f3', mode: 'schedule', scheduledFor: NOW + 3000 }),
        rec({ id: 'f4', mode: 'schedule', scheduledFor: NOW + 4000 }),
      ],
      NOW,
      3,
    );
    expect(list.map((u) => u.id)).toEqual(['f1', 'f2', 'f3']);
  });

  it('無未來排程回空陣列', () => {
    expect(upcomingSchedules([rec({ id: 'a' })], NOW)).toEqual([]);
  });
});

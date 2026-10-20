import { describe, expect, it } from 'vitest';
import { filterRecords, scheduleState } from './historyFilters';
import type { PublishRecord } from '../services/history';

const NOW = 1_000_000;

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

describe('filterRecords', () => {
  const records = [
    rec({ id: 'now-img', mode: 'now', mediaKind: 'image' }),
    rec({ id: 'now-vid', mode: 'now', mediaKind: 'video' }),
    rec({ id: 'sch-img', mode: 'schedule', mediaKind: 'image', scheduledFor: NOW + 1000 }),
    rec({ id: 'aud', mode: 'now', mediaKind: 'audio' }),
  ];

  it('all/all 回全部且保序', () => {
    expect(filterRecords(records, 'all', 'all').map((r) => r.id)).toEqual([
      'now-img',
      'now-vid',
      'sch-img',
      'aud',
    ]);
  });

  it('mode 篩選:now 排除排程、schedule 排除立即', () => {
    expect(filterRecords(records, 'now', 'all').map((r) => r.id)).toEqual(['now-img', 'now-vid', 'aud']);
    expect(filterRecords(records, 'schedule', 'all').map((r) => r.id)).toEqual(['sch-img']);
  });

  it('kind 篩選:video 只留影片;audio/other 不屬圖片也不屬影片(篩「圖片」時排除)', () => {
    expect(filterRecords(records, 'all', 'video').map((r) => r.id)).toEqual(['now-vid']);
    expect(filterRecords(records, 'all', 'image').map((r) => r.id)).toEqual(['now-img', 'sch-img']);
  });

  it('雙維交集(AND)', () => {
    expect(filterRecords(records, 'now', 'video').map((r) => r.id)).toEqual(['now-vid']);
    expect(filterRecords(records, 'schedule', 'video')).toEqual([]);
  });
});

describe('scheduleState', () => {
  it('立即發佈與 scheduledFor=null 回 null', () => {
    expect(scheduleState({ mode: 'now', scheduledFor: null }, NOW)).toBeNull();
    expect(scheduleState({ mode: 'schedule', scheduledFor: null }, NOW)).toBeNull();
  });

  it('未來=pending、過去與恰到點=due', () => {
    expect(scheduleState({ mode: 'schedule', scheduledFor: NOW + 1 }, NOW)).toBe('pending');
    expect(scheduleState({ mode: 'schedule', scheduledFor: NOW - 1 }, NOW)).toBe('due');
    expect(scheduleState({ mode: 'schedule', scheduledFor: NOW }, NOW)).toBe('due');
  });
});

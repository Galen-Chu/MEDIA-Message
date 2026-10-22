import { describe, expect, it } from 'vitest';
import type { PublishRecord } from '../history';
import { FEED_MAX_ITEMS, FEED_SNIPPET_MAX, STALE_MS, scheduleFeedKey } from './config';
import {
  buildScheduleFeed,
  feedPlatformLabel,
  parseScheduleFeed,
  publishOwnFeed,
  readPeerFeed,
  upcomingFeedItems,
} from './feed';

const NOW = 1_800_000_000_000;

function record(partial?: Partial<PublishRecord>): PublishRecord {
  return {
    id: 'r1',
    platform: 'facebook',
    mode: 'schedule',
    mediaName: '相片.jpg',
    mediaKind: 'image',
    mediaSize: 1234,
    caption: '週末市集快閃',
    createdAt: NOW - 1000,
    scheduledFor: NOW + 3_600_000,
    postId: '222',
    ...partial,
  };
}

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

describe('家族排程摘要:寫入端(由發佈歷史組出)', () => {
  it('只取未到點的排程,由近到遠、上限 5 筆;平台轉共用代碼 fb', () => {
    const records = [
      record({ id: 'now', mode: 'now', scheduledFor: null }),
      record({ id: 'past', scheduledFor: NOW - 1 }),
      ...Array.from({ length: FEED_MAX_ITEMS + 1 }, (_, n) =>
        record({ id: `s${n}`, caption: `第${n}則`, scheduledFor: NOW + (10 - n) * 60_000 }),
      ),
    ];
    const feed = buildScheduleFeed(records, NOW);
    expect(feed).toMatchObject({ v: 1, product: 'media-message', updatedAt: NOW });
    expect(feed.items).toHaveLength(FEED_MAX_ITEMS);
    expect(feed.items.map((i) => i.snippet)).toEqual(['第5則', '第4則', '第3則', '第2則', '第1則']);
    expect(feed.items.every((i) => i.platform === 'fb')).toBe(true);
  });

  it('片段:說明優先、空說明用檔名、空白摺疊、超過 60 字截斷加…', () => {
    const long = '字'.repeat(FEED_SNIPPET_MAX + 5);
    const feed = buildScheduleFeed(
      [
        record({ id: 'a', caption: '  多個\n\n空白  ', scheduledFor: NOW + 1 }),
        record({ id: 'b', caption: '', mediaName: '影片.mp4', scheduledFor: NOW + 2 }),
        record({ id: 'c', caption: long, scheduledFor: NOW + 3 }),
      ],
      NOW,
    );
    expect(feed.items.map((i) => i.snippet)).toEqual(['多個 空白', '影片.mp4', `${'字'.repeat(FEED_SNIPPET_MAX)}…`]);
  });

  it('只寫自己那把鍵(media-message);寫入失敗靜默、不拋出', () => {
    const storage = fakeStorage();
    publishOwnFeed([record()], { storage, now: NOW });
    expect([...storage.map.keys()]).toEqual([scheduleFeedKey('media-message')]);
    const full = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError');
      },
    };
    expect(() => publishOwnFeed([record()], { storage: full, now: NOW })).not.toThrow();
    expect(() => publishOwnFeed([record()], { storage: null, now: NOW })).not.toThrow();
  });
});

describe('家族排程摘要:讀取端(文管庫的摘要)', () => {
  // 文管庫 buildScheduleFeed 實際寫入的形狀
  const textFeed = (updatedAt: number, items: unknown[]) =>
    JSON.stringify({ v: 1, product: 'text-message', updatedAt, items });

  it('解析文管庫摘要;單筆壞掉只丟那一筆', () => {
    const raw = textFeed(NOW - 1000, [
      { platform: 'threads', when: NOW + 60_000, snippet: '新文章上線' },
      { platform: 'ig', when: 'x', snippet: '壞的' },
    ]);
    expect(parseScheduleFeed(raw, 'text-message', NOW)).toEqual({
      v: 1,
      product: 'text-message',
      updatedAt: NOW - 1000,
      items: [{ platform: 'threads', when: NOW + 60_000, snippet: '新文章上線' }],
    });
  });

  it('陳舊(updatedAt 超過 7 天)/產品不符/版本不符/格式壞 → null(整區隱藏)', () => {
    expect(parseScheduleFeed(textFeed(NOW - STALE_MS - 1, []), 'text-message', NOW)).toBeNull();
    expect(parseScheduleFeed(textFeed(NOW - STALE_MS, []), 'text-message', NOW)).not.toBeNull();
    expect(parseScheduleFeed(textFeed(NOW, []), 'media-message', NOW)).toBeNull();
    expect(parseScheduleFeed(JSON.stringify({ v: 2, product: 'text-message', updatedAt: NOW, items: [] }), 'text-message', NOW)).toBeNull();
    expect(parseScheduleFeed('{{{', 'text-message', NOW)).toBeNull();
    expect(parseScheduleFeed(null, 'text-message', NOW)).toBeNull();
  });

  it('readPeerFeed 只讀文管庫那把鍵;已過排定時間的項目不顯示;平台代碼轉顯示名稱', () => {
    const storage = fakeStorage();
    storage.setItem(scheduleFeedKey('media-message'), JSON.stringify(buildScheduleFeed([record()], NOW)));
    expect(readPeerFeed({ storage, now: NOW })).toBeNull();
    storage.setItem(
      scheduleFeedKey('text-message'),
      textFeed(NOW - 1000, [
        { platform: 'yt', when: NOW - 1, snippet: '已到點' },
        { platform: 'yt', when: NOW + 1, snippet: '未到點' },
      ]),
    );
    const feed = readPeerFeed({ storage, now: NOW })!;
    expect(upcomingFeedItems(feed, NOW).map((i) => i.snippet)).toEqual(['未到點']);
    expect(feedPlatformLabel('yt')).toBe('YouTube');
    expect(feedPlatformLabel('fb')).toBe('Facebook');
    expect(feedPlatformLabel('mastodon')).toBe('mastodon');
  });
});

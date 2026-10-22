/**
 * 家族排程摘要(U4,2026-10-22)。媒管庫寫 `family:schedule-feed:media-message:v1`
 * (只寫自己的)、讀 `family:schedule-feed:text-message:v1`(只讀對方的)。
 * 解析與形狀複製自文管庫 `src/services/family/feed.ts`(契約同一份);摘要來源改為本庫發佈歷史。
 *
 * 紅線:摘要只含平台、時間與 ≤60 字片段;說明全文不必、token/媒體檔絕不進入。
 */
import type { PublishRecord } from '../history';
import {
  FEED_MAX_ITEMS,
  FEED_PLATFORM_CODE,
  FEED_PLATFORM_LABELS,
  FEED_SNIPPET_MAX,
  PEER_PRODUCT,
  STALE_MS,
  THIS_PRODUCT,
  scheduleFeedKey,
  type FamilyProduct,
} from './config';
import type { FamilyStorage } from './handoff';

export interface ScheduleFeedItem {
  /** 共用平台代碼(見 config FEED_PLATFORM_LABELS)。 */
  platform: string;
  /** epoch ms */
  when: number;
  snippet: string;
}

export interface ScheduleFeed {
  v: 1;
  product: FamilyProduct;
  updatedAt: number;
  items: ScheduleFeedItem[];
}

/** 片段:說明優先;沒寫說明的媒體以檔名代表(對方才認得出是哪一則)。 */
function snippetOf(record: PublishRecord): string {
  const source = (record.caption || record.mediaName || '').replace(/\s+/g, ' ').trim();
  return source.length > FEED_SNIPPET_MAX ? `${source.slice(0, FEED_SNIPPET_MAX)}…` : source;
}

/** 由發佈歷史組出摘要:只取**未到點的排程**,由近到遠取前 FEED_MAX_ITEMS 筆。 */
export function buildScheduleFeed(records: readonly PublishRecord[], now: number): ScheduleFeed {
  const items = records
    .filter((r): r is PublishRecord & { scheduledFor: number } =>
      r.mode === 'schedule' && r.scheduledFor !== null && r.scheduledFor > now,
    )
    .sort((a, b) => a.scheduledFor - b.scheduledFor)
    .slice(0, FEED_MAX_ITEMS)
    .map((r) => ({
      platform: FEED_PLATFORM_CODE[r.platform] ?? r.platform,
      when: r.scheduledFor,
      snippet: snippetOf(r),
    }));
  return { v: 1, product: THIS_PRODUCT, updatedAt: now, items };
}

function isFeedItem(v: unknown): v is ScheduleFeedItem {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.platform === 'string' &&
    typeof o.when === 'number' &&
    Number.isFinite(o.when) &&
    typeof o.snippet === 'string'
  );
}

/**
 * 解析對方的摘要。防禦式:版本不符/形狀壞/產品不符/`updatedAt` 超過 STALE_MS
 * 一律回 null——呼叫端據此**隱藏整區排程**,而非顯示過期排程。
 */
export function parseScheduleFeed(
  raw: string | null,
  expectedProduct: FamilyProduct,
  now: number,
): ScheduleFeed | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const o = parsed as Record<string, unknown>;
  if (o.v !== 1 || o.product !== expectedProduct) return null;
  if (typeof o.updatedAt !== 'number' || !Number.isFinite(o.updatedAt)) return null;
  if (now - o.updatedAt > STALE_MS) return null;
  if (!Array.isArray(o.items)) return null;
  return {
    v: 1,
    product: expectedProduct,
    updatedAt: o.updatedAt,
    items: o.items.filter(isFeedItem),
  };
}

/** 摘要項目中「已過排定時間」的不再顯示(對方若久未開站,摘要裡會殘留已到點的項目)。 */
export function upcomingFeedItems(feed: ScheduleFeed, now: number): ScheduleFeedItem[] {
  return feed.items.filter((i) => i.when > now);
}

export function feedPlatformLabel(code: string): string {
  return FEED_PLATFORM_LABELS[code] ?? code;
}

function defaultStorage(): FamilyStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** 發佈自己的摘要;儲存不可用時靜默略過(僅對方看不到我方排程,本站功能不受影響)。 */
export function publishOwnFeed(
  records: readonly PublishRecord[],
  deps: { storage?: FamilyStorage | null; now?: number } = {},
): void {
  const storage = deps.storage === undefined ? defaultStorage() : deps.storage;
  if (!storage) return;
  try {
    storage.setItem(
      scheduleFeedKey(THIS_PRODUCT),
      JSON.stringify(buildScheduleFeed(records, deps.now ?? Date.now())),
    );
  } catch {
    // 配額滿/隱私模式:摘要是輔助資訊,不提示(配額提示由發佈歷史寫入路徑負責)
  }
}

/** 讀對方的摘要(陳舊或不可用回 null)。 */
export function readPeerFeed(
  deps: { storage?: FamilyStorage | null; now?: number } = {},
): ScheduleFeed | null {
  const storage = deps.storage === undefined ? defaultStorage() : deps.storage;
  if (!storage) return null;
  try {
    return parseScheduleFeed(storage.getItem(scheduleFeedKey(PEER_PRODUCT)), PEER_PRODUCT, deps.now ?? Date.now());
  } catch {
    return null;
  }
}

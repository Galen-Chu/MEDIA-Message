/**
 * 發佈歷史(本機 metadata 記錄;storage 可注入測試)。
 * 紅線:僅存 metadata(檔名/類型/大小/說明/時間/貼文 id)——媒體檔絕不入庫、絕不落地。
 */
import type { MediaKind } from '../types';
import type { PublishMode } from '../types';

/** localStorage 鍵(沿用文管庫「產品:v1」命名慣例)。 */
export const HISTORY_STORAGE_KEY = 'media-message:v1';

/** 上限:歷史為輔助記錄,超出即淘汰最舊。 */
export const HISTORY_MAX_RECORDS = 200;

export interface PublishRecord {
  id: string;
  platform: 'facebook';
  mode: PublishMode;
  mediaName: string;
  mediaKind: MediaKind;
  mediaSize: number;
  caption: string;
  createdAt: number;
  /** 排程模式:平台預定發佈時間(ms);立即發佈為 null。 */
  scheduledFor: number | null;
  /** 平台回傳的貼文/媒體 id(photos=post_id、videos=video id)。 */
  postId: string | null;
}

interface HistoryStorageShape {
  version: 1;
  records: PublishRecord[];
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // 隱私模式等情境:歷史功能靜默停用
  }
}

function parseStored(text: string | null): PublishRecord[] {
  if (!text) return [];
  try {
    const data = JSON.parse(text) as Partial<HistoryStorageShape>;
    if (!Array.isArray(data.records)) return [];
    return data.records.filter(
      (r): r is PublishRecord =>
        !!r &&
        typeof r.id === 'string' &&
        typeof r.mediaName === 'string' &&
        typeof r.createdAt === 'number',
    );
  } catch {
    return [];
  }
}

function persist(records: PublishRecord[], storage: StorageLike | null): void {
  if (!storage) return;
  const shape: HistoryStorageShape = { version: 1, records };
  storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(shape));
}

/** 載入歷史(損壞/不存在 → 空清單;無 localStorage 環境 → 空)。 */
export function loadHistory(storage: StorageLike | null = defaultStorage()): PublishRecord[] {
  if (!storage) return [];
  try {
    return parseStored(storage.getItem(HISTORY_STORAGE_KEY));
  } catch {
    return [];
  }
}

/** 新增記錄(最新在前,超量淘汰最舊),回傳新清單。 */
export function addRecord(record: PublishRecord, storage: StorageLike | null = defaultStorage()): PublishRecord[] {
  const next = [record, ...loadHistory(storage)].slice(0, HISTORY_MAX_RECORDS);
  persist(next, storage);
  return next;
}

/** 清除歷史。 */
export function clearHistory(storage: StorageLike | null = defaultStorage()): void {
  if (!storage) return;
  storage.removeItem(HISTORY_STORAGE_KEY);
}

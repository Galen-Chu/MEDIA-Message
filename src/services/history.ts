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

/**
 * 寫入 storage;失敗(配額滿等)回 false、不拋——呼叫端此時貼文已發佈成功,
 * 記帳失敗不得遮蔽成功結果(拋出會被發佈流程的 catch 吞掉,誘發重複發佈)。
 * 配額以「源」計:本產品與文管庫同在 galen-chu.github.io,共用同一份配額。
 */
function persist(records: PublishRecord[], storage: StorageLike | null): boolean {
  if (!storage) return true; // 無 storage=歷史功能靜默停用,非寫入失敗
  const shape: HistoryStorageShape = { version: 1, records };
  try {
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(shape));
    return true;
  } catch {
    return false;
  }
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

/**
 * 新增記錄(最新在前,超量淘汰最舊)。永不拋出:
 * saveFailed=true 表示寫入 storage 失敗,新清單僅存在記憶體(本次工作階段可見)。
 */
export function addRecord(
  record: PublishRecord,
  storage: StorageLike | null = defaultStorage(),
): { records: PublishRecord[]; saveFailed: boolean } {
  const records = [record, ...loadHistory(storage)].slice(0, HISTORY_MAX_RECORDS);
  return { records, saveFailed: !persist(records, storage) };
}

/** 清除歷史。 */
export function clearHistory(storage: StorageLike | null = defaultStorage()): void {
  if (!storage) return;
  storage.removeItem(HISTORY_STORAGE_KEY);
}

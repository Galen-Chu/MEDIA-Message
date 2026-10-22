/**
 * 家族交接佇列(U3,2026-10-22)。媒管庫目前只當**讀取端**:媒庫收件匣讀取
 * `family:handoff:v1` 中 `to` 是自己的項目,取用(套用/存為素材/捨棄)後即刪除;
 * 寫入端在文管庫(文庫/編發器「送至媒管庫」)。
 *
 * parse/prune/append/serialize 複製自文管庫 `src/services/family/handoff.ts`(契約同一份);
 * 讀取端函式為本庫新增。所有解析一律防禦式:版本不符/格式壞=**當作不存在**,
 * 不報錯、不拋例外——與降級模式同精神。
 */
import {
  HANDOFF_KEY,
  HANDOFF_MAX_ITEMS,
  STALE_MS,
  THIS_PRODUCT,
  type FamilyProduct,
} from './config';

export interface HandoffItem {
  id: string;
  from: FamilyProduct;
  to: FamilyProduct;
  /** 目前僅 'caption'(文案);新增種類時兩邊契約文件同步。 */
  kind: 'caption';
  text: string;
  createdAt: number;
}

/** 可注入的儲存介面(供測試;與文管庫同形)。 */
export interface FamilyStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isProduct(v: unknown): v is FamilyProduct {
  return v === 'text-message' || v === 'media-message';
}

function isHandoffItem(v: unknown): v is HandoffItem {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    isProduct(o.from) &&
    isProduct(o.to) &&
    o.kind === 'caption' &&
    typeof o.text === 'string' &&
    typeof o.createdAt === 'number' &&
    Number.isFinite(o.createdAt)
  );
}

/** 解析佇列;版本不符或形狀壞一律回 []。單筆壞掉只丟那一筆,不連坐整個佇列。 */
export function parseHandoff(raw: string | null): HandoffItem[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (typeof parsed !== 'object' || parsed === null) return [];
  const envelope = parsed as Record<string, unknown>;
  if (envelope.v !== 1 || !Array.isArray(envelope.items)) return [];
  return envelope.items.filter(isHandoffItem);
}

/** 陳舊項目剔除(超過 STALE_MS 視為不存在)。 */
export function pruneHandoff(items: HandoffItem[], now: number): HandoffItem[] {
  return items.filter((i) => now - i.createdAt <= STALE_MS);
}

/** 純函式 append:先剔除陳舊,再放新項目,超量淘汰最舊(佇列尾端為最新)。 */
export function appendHandoff(items: HandoffItem[], item: HandoffItem, now: number): HandoffItem[] {
  const next = [...pruneHandoff(items, now), item];
  return next.slice(-HANDOFF_MAX_ITEMS);
}

export function serializeHandoff(items: HandoffItem[]): string {
  return JSON.stringify({ v: 1, items });
}

/** 收件匣視圖:只取 `to` 是本庫的項目,最新在前(佇列尾端為最新)。 */
function inboxOf(items: HandoffItem[]): HandoffItem[] {
  return items.filter((i) => i.to === THIS_PRODUCT).reverse();
}

function defaultStorage(): FamilyStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // 隱私模式等情境:收件匣靜默停用
  }
}

/**
 * 讀取收件匣。契約要求讀取端刪除陳舊項目:剔除後若有變動即寫回
 * (寫回失敗不影響回傳——陳舊項目本就視為不存在)。
 */
export function loadInbox(
  deps: { storage?: FamilyStorage | null; now?: number } = {},
): HandoffItem[] {
  const storage = deps.storage === undefined ? defaultStorage() : deps.storage;
  if (!storage) return [];
  const now = deps.now ?? Date.now();
  try {
    const all = parseHandoff(storage.getItem(HANDOFF_KEY));
    const fresh = pruneHandoff(all, now);
    if (fresh.length !== all.length) {
      try {
        storage.setItem(HANDOFF_KEY, serializeHandoff(fresh));
      } catch {
        // 寫回失敗:下次讀取再剔除即可
      }
    }
    return inboxOf(fresh);
  } catch {
    return [];
  }
}

/**
 * 取用一筆交接(套用/存為素材/捨棄共用):寫入前**重新讀取**佇列——文管庫分頁
 * 可能剛 append 新項目,不可用舊快照覆蓋。只刪 `to` 是本庫的該筆,
 * 送往文管庫的項目一律不動。永不拋出:removeFailed=true 表示寫回失敗
 * (該筆仍在佇列、重新整理後會再出現,呼叫端據此誠實提示)。
 */
export function takeHandoff(
  id: string,
  deps: { storage?: FamilyStorage | null; now?: number } = {},
): { inbox: HandoffItem[]; item: HandoffItem | null; removeFailed: boolean } {
  const storage = deps.storage === undefined ? defaultStorage() : deps.storage;
  if (!storage) return { inbox: [], item: null, removeFailed: false };
  const now = deps.now ?? Date.now();
  let all: HandoffItem[];
  try {
    all = pruneHandoff(parseHandoff(storage.getItem(HANDOFF_KEY)), now);
  } catch {
    return { inbox: [], item: null, removeFailed: false };
  }
  const item = all.find((i) => i.id === id && i.to === THIS_PRODUCT) ?? null;
  if (!item) return { inbox: inboxOf(all), item: null, removeFailed: false };
  const next = all.filter((i) => i !== item);
  try {
    storage.setItem(HANDOFF_KEY, serializeHandoff(next));
    return { inbox: inboxOf(next), item, removeFailed: false };
  } catch {
    return { inbox: inboxOf(all), item, removeFailed: true };
  }
}

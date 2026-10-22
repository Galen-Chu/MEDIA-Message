/**
 * 家族串接設定(U3 起,2026-10-22;複製自文管庫 `src/services/family/config.ts`,
 * 僅對調 THIS/PEER 與 PEER_URL)。文管庫與媒管庫同為 `galen-chu.github.io`
 * (origin 只看 scheme+host+port,路徑不計)→ 共用 localStorage,零後端即可交接。
 *
 * 契約設計(`docs/IA-PLAN.md` IA-D4/§3.2,兩 repo 各複製一份、文件記載同一份):
 * **不互讀對方內部鍵**(`text-message:v2` / `media-message:v1`)——改走版本化的
 * 小型契約鍵,各自只寫自己產出的部分。
 *
 * 紅線(兩邊一致):契約內**只有文字與 metadata**;媒體檔、平台 token、Gemini key、
 * emails 絕不進入 `family:*` 任何鍵。
 */

/** 產品識別字(契約欄位值,勿隨 UI 命名變動)。 */
export type FamilyProduct = 'text-message' | 'media-message';

export const THIS_PRODUCT: FamilyProduct = 'media-message';
export const PEER_PRODUCT: FamilyProduct = 'text-message';

/** 一次性交接佇列(雙向共用一把鍵,項目以 `to` 定址)。 */
export const HANDOFF_KEY = 'family:handoff:v1';

/** 佇列上限,超量淘汰最舊(與文管庫同值)。 */
export const HANDOFF_MAX_ITEMS = 20;

/**
 * 陳舊判定:7 天(與文管庫同值)。交接超過 7 天讀取時視為不存在並刪除——
 * 幾週後冒出早已遺忘的文案,體感是 bug 不是功能。
 */
export const STALE_MS = 7 * 24 * 60 * 60 * 1000;

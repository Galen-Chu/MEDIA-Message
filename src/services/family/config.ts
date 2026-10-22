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

/** 唯讀排程摘要:只寫自己的、只讀對方的。 */
export function scheduleFeedKey(product: FamilyProduct): string {
  return `family:schedule-feed:${product}:v1`;
}

/** 排程摘要的 snippet 上限字數(與文管庫同值)。 */
export const FEED_SNIPPET_MAX = 60;

/** 排程摘要筆數上限(對方只需「近期」,不是全量;與文管庫同值)。 */
export const FEED_MAX_ITEMS = 5;

/**
 * 摘要 `platform` 欄位的共用代碼=文管庫 `PlatformKey`(其摘要以此寫入、以 PLATFORM_META 顯示)。
 * 本庫寫入時把內部平台名轉成共用代碼,讀取時轉成顯示名稱;未知代碼原樣顯示。
 * 新平台上線時兩邊契約文件同步(IA-PLAN §3.2)。
 */
export const FEED_PLATFORM_LABELS: Record<string, string> = {
  fb: 'Facebook',
  ig: 'Instagram',
  threads: 'Threads',
  line: 'LINE',
  yt: 'YouTube',
  linkedin: 'LinkedIn',
};

/** 本庫內部平台名 → 共用代碼。 */
export const FEED_PLATFORM_CODE: Record<string, string> = {
  facebook: 'fb',
};

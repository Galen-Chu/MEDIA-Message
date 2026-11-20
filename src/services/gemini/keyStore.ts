/**
 * Gemini 金鑰存取(M-PLAN D8 一期):本庫自有金鑰 + IA-D8 跨產品契約。
 *
 * **IA-D8 契約(2026-10-12 兩庫維護者定案,文管庫 `docs/IA-PLAN.md` §1/§3.2)**
 * ——本檔是媒管庫側的實作:
 * - 跨產品可共用的敏感資料**只有 Gemini 金鑰**:本庫得以**唯讀**文管庫的
 *   `text-message:gemini-key`(使用當下才讀、不複製、**永不寫入或清除**)。
 * - 介面由使用者自行勾選「使用文管庫已設定的金鑰」並標示來源;文管庫端
 *   清除金鑰,本庫下次讀取即為空(誠實顯示「文管庫金鑰已不存在」)。
 * - 這是「不互讀對方內部鍵」原則(IA-D4)的唯一明文例外——金鑰因此**不進入**
 *   任何 `family:*` 契約鍵;OAuth token 與郵件內容依舊不跨產品流動。
 * - 文管庫承諾未與本庫協調前不改該鍵名與「純字串即金鑰」的格式
 *   (`text-message:gemini-key` 旁有 4 個測試釘住;要改就兩邊同時改)。
 * - 兩庫同源(`galen-chu.github.io`),金鑰自始至終只在使用者瀏覽器,不經後端;
 *   但共用=**兩產品花同一份 Gemini 配額**,UI 須誠實標示(見 AI_COPY)。
 */
export const OWN_KEY_STORAGE = 'media-message:gemini-key';
export const KEY_SOURCE_STORAGE = 'media-message:gemini-source';
/** 文管庫的金鑰鍵(契約唯讀;鍵名由文管庫 `rewrite.ts` 的測試釘住,勿改名)。 */
export const PEER_KEY_STORAGE = 'text-message:gemini-key';

export type GeminiKeySource = 'own' | 'peer';

export function loadOwnKey(): string {
  try {
    return localStorage.getItem(OWN_KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

export function saveOwnKey(key: string): void {
  try {
    localStorage.setItem(OWN_KEY_STORAGE, key);
  } catch {
    // 隱私模式等情境下靜默退回記憶體模式
  }
}

export function clearOwnKey(): void {
  try {
    localStorage.removeItem(OWN_KEY_STORAGE);
  } catch {
    // 同上
  }
}

/** 唯讀文管庫金鑰(IA-D8):只讀這一把、只在使用者勾選來源='peer' 時被呼叫端使用。 */
export function loadPeerKey(): string {
  try {
    return localStorage.getItem(PEER_KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

/** 目前要用的金鑰來源('own' 預設;壞值防禦式退回 'own')。 */
export function getKeySource(): GeminiKeySource {
  try {
    return localStorage.getItem(KEY_SOURCE_STORAGE) === 'peer' ? 'peer' : 'own';
  } catch {
    return 'own';
  }
}

export function setKeySource(source: GeminiKeySource): void {
  try {
    localStorage.setItem(KEY_SOURCE_STORAGE, source);
  } catch {
    // 記不住來源=每次都當 own,功能可用只是預設不勾
  }
}

/** 依來源偏好解析當下生效的金鑰;空值交呼叫端處理(no_key / peer_key_missing)。 */
export function resolveActiveKey(): { key: string; source: GeminiKeySource } {
  const source = getKeySource();
  return { key: source === 'peer' ? loadPeerKey() : loadOwnKey(), source };
}

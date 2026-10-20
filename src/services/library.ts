/**
 * 媒庫說明素材(IA-D6 紅線:媒庫只存文字素材,媒體檔絕不落地、絕不經後端)。
 * 鏡像 services/history.ts 模式:storage 可注入、防禦式解析、永不拋例外。
 */
import type { StorageLike } from './history';

/** localStorage 鍵(獨立於發佈歷史的 media-message:v1)。 */
export const LIBRARY_STORAGE_KEY = 'media-message:library:v1';

/** 上限:說明素材為輔助工具,超出即淘汰最舊。 */
export const LIBRARY_MAX_TEMPLATES = 50;

export interface CaptionTemplate {
  id: string;
  text: string;
  createdAt: number;
}

interface LibraryStorageShape {
  version: 1;
  templates: CaptionTemplate[];
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // 隱私模式等情境:媒庫靜默停用
  }
}

function parseStored(text: string | null): CaptionTemplate[] {
  if (!text) return [];
  try {
    const data = JSON.parse(text) as Partial<LibraryStorageShape>;
    if (data.version !== 1 || !Array.isArray(data.templates)) return [];
    return data.templates.filter(
      (t): t is CaptionTemplate =>
        !!t &&
        typeof t.id === 'string' &&
        typeof t.text === 'string' &&
        typeof t.createdAt === 'number',
    );
  } catch {
    return [];
  }
}

/** 寫入 storage;失敗(配額滿等)回 false、不拋(配額與文管庫共用同一來源)。 */
function persist(templates: readonly CaptionTemplate[], storage: StorageLike | null): boolean {
  if (!storage) return true; // 無 storage=媒庫靜默停用,非寫入失敗
  const shape: LibraryStorageShape = { version: 1, templates: [...templates] };
  try {
    storage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(shape));
    return true;
  } catch {
    return false;
  }
}

/** 載入說明素材(損壞/不存在 → 空清單)。 */
export function loadTemplates(storage: StorageLike | null = defaultStorage()): CaptionTemplate[] {
  if (!storage) return [];
  return parseStored(storage.getItem(LIBRARY_STORAGE_KEY));
}

/**
 * 儲存目前說明為素材(trim;最新在前;超量淘汰最舊)。永不拋出:
 * saveFailed=true 表示寫入失敗,清單僅存在記憶體(本次工作階段可見)。
 */
export function saveTemplate(
  text: string,
  storage: StorageLike | null = defaultStorage(),
): { templates: CaptionTemplate[]; saveFailed: boolean } {
  const trimmed = text.trim();
  const existing = loadTemplates(storage);
  if (!trimmed) return { templates: existing, saveFailed: false };
  const templates = [
    { id: crypto.randomUUID(), text: trimmed, createdAt: Date.now() },
    ...existing,
  ].slice(0, LIBRARY_MAX_TEMPLATES);
  return { templates, saveFailed: !persist(templates, storage) };
}

/** 刪除指定素材(不存在=no-op)。 */
export function deleteTemplate(
  id: string,
  storage: StorageLike | null = defaultStorage(),
): CaptionTemplate[] {
  const templates = loadTemplates(storage).filter((t) => t.id !== id);
  persist(templates, storage);
  return templates;
}

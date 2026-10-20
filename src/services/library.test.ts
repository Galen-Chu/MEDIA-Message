import { describe, expect, it } from 'vitest';
import {
  LIBRARY_MAX_TEMPLATES,
  LIBRARY_STORAGE_KEY,
  deleteTemplate,
  loadTemplates,
  saveTemplate,
} from './library';

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

class FullStorage extends MemoryStorage {
  setItem(): void {
    throw new DOMException('QuotaExceededError', 'QuotaExceededError');
  }
}

describe('loadTemplates', () => {
  it('空儲存回空清單;storage=null(無 localStorage 環境)亦同', () => {
    expect(loadTemplates(new MemoryStorage())).toEqual([]);
    expect(loadTemplates(null)).toEqual([]);
  });

  it('完整寫入形狀:version 1 + templates 陣列,id/text/createdAt 齊全才載入', () => {
    const storage = new MemoryStorage();
    saveTemplate('第一則', storage);
    const parsed = JSON.parse(storage.getItem(LIBRARY_STORAGE_KEY)!) as {
      version: number;
      templates: Array<{ id: string; text: string; createdAt: number }>;
    };
    expect(parsed.version).toBe(1);
    expect(parsed.templates).toHaveLength(1);
    expect(parsed.templates[0].text).toBe('第一則');
    expect(typeof parsed.templates[0].id).toBe('string');
    expect(typeof parsed.templates[0].createdAt).toBe('number');
    expect(loadTemplates(storage)[0].text).toBe('第一則');
  });

  it('防禦式解析:非 JSON/version 不符/非陣列 → 空;單筆欄位壞 → 只跳過該筆', () => {
    const storage = new MemoryStorage();
    storage.setItem(LIBRARY_STORAGE_KEY, 'not-json{{{');
    expect(loadTemplates(storage)).toEqual([]);
    storage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify({ version: 2, templates: [] }));
    expect(loadTemplates(storage)).toEqual([]);
    storage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify({ version: 1, templates: 'x' }));
    expect(loadTemplates(storage)).toEqual([]);
    storage.setItem(
      LIBRARY_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        templates: [{ id: 'ok', text: '好素材', createdAt: 1 }, { id: 2, text: '壞id', createdAt: 2 }, null],
      }),
    );
    const loaded = loadTemplates(storage);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].text).toBe('好素材');
  });
});

describe('saveTemplate', () => {
  it('最新在前;trim 後空白=no-op(不新增也不寫入)', () => {
    const storage = new MemoryStorage();
    saveTemplate('舊素材', storage);
    const { templates, saveFailed } = saveTemplate('  \n\t', storage);
    expect(saveFailed).toBe(false);
    expect(templates.map((t) => t.text)).toEqual(['舊素材']);
    const after = saveTemplate('新素材', storage);
    expect(after.templates.map((t) => t.text)).toEqual(['新素材', '舊素材']);
  });

  it('內容前後空白會被 trim 掉', () => {
    const { templates } = saveTemplate('  有提醒的說明 \n', new MemoryStorage());
    expect(templates[0].text).toBe('有提醒的說明');
  });

  it(`上限 ${LIBRARY_MAX_TEMPLATES} 筆:超量淘汰最舊`, () => {
    const storage = new MemoryStorage();
    for (let i = 0; i < LIBRARY_MAX_TEMPLATES + 3; i += 1) saveTemplate(`素材${i}`, storage);
    const templates = loadTemplates(storage);
    expect(templates).toHaveLength(LIBRARY_MAX_TEMPLATES);
    expect(templates[0].text).toBe(`素材${LIBRARY_MAX_TEMPLATES + 2}`); // 最新保留
    expect(templates[templates.length - 1].text).toBe('素材3'); // 最舊三者淘汰
  });

  it('配額滿:saveFailed=true 且記憶體清單仍含新素材', () => {
    const full = new FullStorage();
    const { templates, saveFailed } = saveTemplate('存不進去', full);
    expect(saveFailed).toBe(true);
    expect(templates[0].text).toBe('存不進去');
  });
});

describe('deleteTemplate', () => {
  it('移除指定筆、保留其餘;不存在=no-op', () => {
    const storage = new MemoryStorage();
    const { templates: seed } = saveTemplate('A', storage);
    saveTemplate('B', storage);
    const after = deleteTemplate(seed[0].id, storage);
    expect(after.map((t) => t.text)).toEqual(['B']);
    expect(deleteTemplate('no-such-id', storage).map((t) => t.text)).toEqual(['B']);
    expect(loadTemplates(storage).map((t) => t.text)).toEqual(['B']); // 已同步寫回
  });
});

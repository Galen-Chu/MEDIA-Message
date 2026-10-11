import { describe, expect, it } from 'vitest';
import { addRecord, clearHistory, HISTORY_MAX_RECORDS, HISTORY_STORAGE_KEY, loadHistory } from './history';
import type { PublishRecord } from './history';

/** 假 storage(node 測試環境無 localStorage)。 */
function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

function record(partial?: Partial<PublishRecord>): PublishRecord {
  return {
    id: 'r1',
    platform: 'facebook',
    mode: 'now',
    mediaName: '相片.jpg',
    mediaKind: 'image',
    mediaSize: 1234,
    caption: '說明',
    createdAt: 1767225600000,
    scheduledFor: null,
    postId: '222_333',
    ...partial,
  };
}

describe('發佈歷史(僅 metadata 落地)', () => {
  it('新增後可載入,最新在前;序列化內容不含任何媒體位元組', () => {
    const storage = fakeStorage();
    const first = record({ id: 'a', mediaName: 'a.png' });
    const second = record({ id: 'b', mediaName: 'b.mp4', mediaKind: 'video', mode: 'schedule', scheduledFor: 1767312000000, postId: '987' });
    let list = addRecord(first, storage).records;
    list = addRecord(second, storage).records;
    expect(list.map((r) => r.id)).toEqual(['b', 'a']);
    expect(loadHistory(storage).map((r) => r.mediaName)).toEqual(['b.mp4', 'a.png']);
    // 紅線斷言:storage 內容只含 metadata 欄位(此處記錄本就無媒體內容,形狀守恆)
    const raw = storage.getItem(HISTORY_STORAGE_KEY)!;
    expect(JSON.parse(raw)).toEqual({ version: 1, records: [second, first] });
  });

  it('損壞/不存在的鍵 → 空清單;清除後為空', () => {
    const storage = fakeStorage();
    expect(loadHistory(storage)).toEqual([]);
    storage.setItem(HISTORY_STORAGE_KEY, '{{{不是 json');
    expect(loadHistory(storage)).toEqual([]);
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({ version: 1, records: 'x' }));
    expect(loadHistory(storage)).toEqual([]);
    addRecord(record(), storage);
    clearHistory(storage);
    expect(loadHistory(storage)).toEqual([]);
  });

  it('超量淘汰最舊(上限 200)', () => {
    const storage = fakeStorage();
    for (let i = 0; i < HISTORY_MAX_RECORDS + 3; i += 1) {
      addRecord(record({ id: `r${i}`, createdAt: i }), storage);
    }
    const list = loadHistory(storage);
    expect(list).toHaveLength(HISTORY_MAX_RECORDS);
    expect(list[0]!.id).toBe(`r${HISTORY_MAX_RECORDS + 2}`); // 最新在前
    expect(list[list.length - 1]!.id).toBe('r3'); // 最舊三筆被淘汰
  });

  it('寫入失敗(配額滿)不拋出:回 saveFailed=true,新清單仍含本筆供當次工作階段顯示', () => {
    const storage = fakeStorage();
    addRecord(record({ id: 'old' }), storage);
    const full = {
      ...storage,
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError');
      },
    };
    const result = addRecord(record({ id: 'new' }), full);
    expect(result.saveFailed).toBe(true);
    expect(result.records.map((r) => r.id)).toEqual(['new', 'old']);
    // 既有已落地資料不受影響
    expect(loadHistory(storage).map((r) => r.id)).toEqual(['old']);
  });

  it('正常寫入 saveFailed=false;無 storage 環境(歷史靜默停用)亦不視為失敗', () => {
    expect(addRecord(record(), fakeStorage()).saveFailed).toBe(false);
    const result = addRecord(record(), null);
    expect(result).toEqual({ records: [record()], saveFailed: false });
  });
});

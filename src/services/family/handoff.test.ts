import { describe, expect, it } from 'vitest';
import { HANDOFF_KEY, HANDOFF_MAX_ITEMS, STALE_MS } from './config';
import {
  appendHandoff,
  loadInbox,
  parseHandoff,
  pruneHandoff,
  serializeHandoff,
  takeHandoff,
  type HandoffItem,
} from './handoff';

const NOW = 1_800_000_000_000;

function fakeStorage(initial?: string) {
  const map = new Map<string, string>();
  if (initial !== undefined) map.set(HANDOFF_KEY, initial);
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

function item(partial?: Partial<HandoffItem>): HandoffItem {
  return {
    id: 'h1',
    from: 'text-message',
    to: 'media-message',
    kind: 'caption',
    text: '文管庫送來的文案',
    createdAt: NOW - 1000,
    ...partial,
  };
}

describe('家族交接佇列:解析(契約與文管庫同一份)', () => {
  it('文管庫 sendCaptionToPeer 實際寫入的形狀可被解析', () => {
    // 文管庫 serializeHandoff 產出:{ v: 1, items: [...] },佇列尾端為最新
    const raw = JSON.stringify({ v: 1, items: [item()] });
    expect(parseHandoff(raw)).toEqual([item()]);
  });

  it('版本不符/格式壞/非物件 → 當作不存在;單筆壞掉只丟那一筆', () => {
    expect(parseHandoff(null)).toEqual([]);
    expect(parseHandoff('{{{')).toEqual([]);
    expect(parseHandoff('"str"')).toEqual([]);
    expect(parseHandoff(JSON.stringify({ v: 2, items: [item()] }))).toEqual([]);
    expect(parseHandoff(JSON.stringify({ v: 1, items: 'x' }))).toEqual([]);
    const mixed = JSON.stringify({
      v: 1,
      items: [item({ id: 'ok' }), { id: 'bad', kind: 'video' }, item({ id: 'nan', createdAt: Number.NaN })],
    });
    expect(parseHandoff(mixed).map((i) => i.id)).toEqual(['ok']);
  });

  it('7 天陳舊判定;append 超量淘汰最舊(上限與文管庫同值)', () => {
    const stale = item({ id: 'stale', createdAt: NOW - STALE_MS - 1 });
    const edge = item({ id: 'edge', createdAt: NOW - STALE_MS });
    expect(pruneHandoff([stale, edge], NOW).map((i) => i.id)).toEqual(['edge']);

    let items: HandoffItem[] = [];
    for (let n = 0; n < HANDOFF_MAX_ITEMS + 2; n += 1) {
      items = appendHandoff(items, item({ id: `i${n}`, createdAt: NOW }), NOW);
    }
    expect(items).toHaveLength(HANDOFF_MAX_ITEMS);
    expect(items[items.length - 1]!.id).toBe(`i${HANDOFF_MAX_ITEMS + 1}`);
    expect(JSON.parse(serializeHandoff(items))).toEqual({ v: 1, items });
  });
});

describe('收件匣(讀取端)', () => {
  it('只列 to=媒管庫 的項目,最新在前;送往文管庫的不列', () => {
    const storage = fakeStorage(
      serializeHandoff([
        item({ id: 'a', createdAt: NOW - 3000 }),
        item({ id: 'toText', from: 'media-message', to: 'text-message' }),
        item({ id: 'b', createdAt: NOW - 2000 }),
      ]),
    );
    expect(loadInbox({ storage, now: NOW }).map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('讀取時刪除陳舊項目並寫回;無變動則不寫', () => {
    const storage = fakeStorage(
      serializeHandoff([item({ id: 'old', createdAt: NOW - STALE_MS - 1 }), item({ id: 'new' })]),
    );
    expect(loadInbox({ storage, now: NOW }).map((i) => i.id)).toEqual(['new']);
    expect(parseHandoff(storage.getItem(HANDOFF_KEY)).map((i) => i.id)).toEqual(['new']);

    let writes = 0;
    const quiet = { ...fakeStorage(serializeHandoff([item()])), setItem: () => void (writes += 1) };
    loadInbox({ storage: quiet, now: NOW });
    expect(writes).toBe(0);
  });

  it('無 storage/讀取拋錯 → 空收件匣,不拋出', () => {
    expect(loadInbox({ storage: null, now: NOW })).toEqual([]);
    const broken = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => undefined,
    };
    expect(loadInbox({ storage: broken, now: NOW })).toEqual([]);
  });

  it('取用:重新讀取後只刪該筆,保留文管庫分頁剛 append 的新項目與送往文管庫的項目', () => {
    const storage = fakeStorage(serializeHandoff([item({ id: 'a' })]));
    // 模擬:媒管庫顯示收件匣之後,文管庫分頁又 append 了一筆、另有一筆送往文管庫
    storage.setItem(
      HANDOFF_KEY,
      serializeHandoff([
        item({ id: 'a' }),
        item({ id: 'toText', from: 'media-message', to: 'text-message' }),
        item({ id: 'late' }),
      ]),
    );
    const result = takeHandoff('a', { storage, now: NOW });
    expect(result.item?.id).toBe('a');
    expect(result.removeFailed).toBe(false);
    expect(result.inbox.map((i) => i.id)).toEqual(['late']);
    expect(parseHandoff(storage.getItem(HANDOFF_KEY)).map((i) => i.id)).toEqual(['toText', 'late']);
  });

  it('取用不存在或送往文管庫的 id → item=null、佇列不動', () => {
    const raw = serializeHandoff([item({ id: 'toText', from: 'media-message', to: 'text-message' })]);
    const storage = fakeStorage(raw);
    expect(takeHandoff('toText', { storage, now: NOW })).toEqual({ inbox: [], item: null, removeFailed: false });
    expect(takeHandoff('nope', { storage, now: NOW }).item).toBeNull();
    expect(storage.getItem(HANDOFF_KEY)).toBe(raw);
  });

  it('寫回失敗(配額滿)不拋出:回 item 與 removeFailed=true,收件匣仍含該筆', () => {
    const base = fakeStorage(serializeHandoff([item({ id: 'a' })]));
    const full = {
      getItem: base.getItem,
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError');
      },
    };
    const result = takeHandoff('a', { storage: full, now: NOW });
    expect(result.item?.id).toBe('a');
    expect(result.removeFailed).toBe(true);
    expect(result.inbox.map((i) => i.id)).toEqual(['a']);
  });
});

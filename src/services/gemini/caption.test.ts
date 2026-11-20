/**
 * 看圖生說明單元測試(node 環境;fetch 以 stub 注入,依串接紀律斷言完整請求形狀)。
 * node 無 localStorage → 模型記憶走 try/catch 空值路徑(每次從候選第一位開始)。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GEMINI_MODEL_CANDIDATES,
  IMAGE_INLINE_LIMIT_BYTES,
  buildCaptionPrompt,
  checkImageEligible,
  generateMediaCaption,
  parseCaptionReply,
  statusToCode,
} from './caption';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

function okResponse(text: string): Response {
  return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) } as unknown as Response;
}

function statusResponse(status: number): Response {
  return { ok: false, status, json: async () => ({}) } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('buildCaptionPrompt', () => {
  it('含核心規則:只描述可見內容、標籤行格式、只輸出說明與標籤', () => {
    const p = buildCaptionPrompt();
    expect(p).toContain('只描述圖片中實際可見的內容');
    expect(p).toContain('標籤: #標籤1 #標籤2 #標籤3');
    expect(p).toContain('只輸出說明與標籤行');
    expect(p).toContain('Facebook 粉專');
  });

  it('有 limit 才加字數行', () => {
    expect(buildCaptionPrompt(300)).toContain('說明總長度不得超過 300 字');
    expect(buildCaptionPrompt()).not.toContain('總長度不得超過');
    expect(buildCaptionPrompt(0)).not.toContain('總長度不得超過');
  });
});

describe('parseCaptionReply', () => {
  it('說明與標籤行分離(半形冒號)', () => {
    const r = parseCaptionReply('山景第一行\n山景第二行\n標籤: #山景 #午後 #走走');
    expect(r.caption).toBe('山景第一行\n山景第二行');
    expect(r.tags).toEqual(['#山景', '#午後', '#走走']);
  });

  it('全形冒號也認得', () => {
    const r = parseCaptionReply('說明\n標籤： #a #b');
    expect(r.caption).toBe('說明');
    expect(r.tags).toEqual(['#a', '#b']);
  });

  it('沒有標籤行=全文都是說明', () => {
    const r = parseCaptionReply('純說明內容');
    expect(r).toEqual({ caption: '純說明內容', tags: [] });
  });

  it('重複標籤去重(保序)', () => {
    const r = parseCaptionReply('說明\n標籤: #a #b #a');
    expect(r.tags).toEqual(['#a', '#b']);
  });

  it('以最後一個標籤行為界,其後雜訊丟棄(prompt 約定標籤在最後)', () => {
    const r = parseCaptionReply('說明A\n標籤: #x\n雜訊行');
    expect(r.caption).toBe('說明A');
    expect(r.tags).toEqual(['#x']);
  });
});

describe('checkImageEligible', () => {
  it('圖片且在上限內=過關;剛好等於上限也過', () => {
    expect(checkImageEligible({ kind: 'image', size: 1024 })).toBeNull();
    expect(checkImageEligible({ kind: 'image', size: IMAGE_INLINE_LIMIT_BYTES })).toBeNull();
  });

  it('一期只支援圖片;超過 15MB 拒絕', () => {
    expect(checkImageEligible({ kind: 'video', size: 1024 })).toBe('unsupported_kind');
    expect(checkImageEligible({ kind: 'image', size: IMAGE_INLINE_LIMIT_BYTES + 1 })).toBe('image_too_large');
  });
});

describe('statusToCode', () => {
  it('與文管庫同對應', () => {
    expect(statusToCode(401)).toBe('invalid_key');
    expect(statusToCode(403)).toBe('invalid_key');
    expect(statusToCode(400)).toBe('invalid_key');
    expect(statusToCode(404)).toBe('model_unavailable');
    expect(statusToCode(429)).toBe('quota');
    expect(statusToCode(500)).toBe('server');
    expect(statusToCode(503)).toBe('server');
    expect(statusToCode(200)).toBe('unknown');
  });
});

describe('generateMediaCaption', () => {
  it('成功:完整請求形狀(URL/method/headers/prompt+inlineData parts)與回應解析', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('午后山景說明\n標籤: #山景 #午後 #走走'));
    vi.stubGlobal('fetch', fetchMock);

    const outcome = await generateMediaCaption({ apiKey: 'TEST_KEY', imageBase64: 'QUJD', mimeType: 'image/png' });

    expect(outcome).toEqual({ ok: true, caption: '午后山景說明', tags: ['#山景', '#午後', '#走走'] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${ENDPOINT}/${GEMINI_MODEL_CANDIDATES[0]}:generateContent`);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json', 'x-goog-api-key': 'TEST_KEY' });
    const body = JSON.parse(String(init.body)) as {
      contents: Array<{ parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }>;
      generationConfig: Record<string, unknown>;
    };
    expect(body.contents).toHaveLength(1);
    expect(body.contents[0].parts[0].text).toBe(buildCaptionPrompt());
    expect(body.contents[0].parts[1].inlineData).toEqual({ mimeType: 'image/png', data: 'QUJD' });
    expect(body.generationConfig).toEqual({ temperature: 0.7, maxOutputTokens: 2048 });
  });

  it('404=此 key 無此模型 → 換下一個候選再試(文管庫同策略)', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(statusResponse(404))
      .mockResolvedValueOnce(okResponse('說明\n標籤: #a'));
    vi.stubGlobal('fetch', fetchMock);

    const outcomePromise = generateMediaCaption({ apiKey: 'K', imageBase64: 'QQ', mimeType: 'image/jpeg' });
    await vi.advanceTimersByTimeAsync(800);
    const outcome = await outcomePromise;

    expect(outcome.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[1] as unknown[])[0]).toBe(`${ENDPOINT}/${GEMINI_MODEL_CANDIDATES[1]}:generateContent`);
  });

  it('401=key 問題 → 立即結束不換模型', async () => {
    const fetchMock = vi.fn().mockResolvedValue(statusResponse(401));
    vi.stubGlobal('fetch', fetchMock);

    const outcome = await generateMediaCaption({ apiKey: 'BAD', imageBase64: 'QQ', mimeType: 'image/png' });

    expect(outcome).toEqual({ ok: false, code: 'invalid_key' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('AbortError → aborted(顯示「已停止」非網路錯誤)', async () => {
    const abortErr = Object.assign(new Error('The user aborted'), { name: 'AbortError' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortErr));

    const outcome = await generateMediaCaption({ apiKey: 'K', imageBase64: 'QQ', mimeType: 'image/png' });

    expect(outcome).toEqual({ ok: false, code: 'aborted' });
  });

  it('網路異常 → network', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));

    const outcome = await generateMediaCaption({ apiKey: 'K', imageBase64: 'QQ', mimeType: 'image/png' });

    expect(outcome).toEqual({ ok: false, code: 'network' });
  });
});

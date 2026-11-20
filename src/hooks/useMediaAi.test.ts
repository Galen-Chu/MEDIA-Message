/**
 * useMediaAi hook 測試(jsdom + RTL;generateMediaCaption 以 partial mock 注入,
 * 檔案→base64 走真實 FileReader)。家族紀律:afterEach cleanup、非同步尾段包 act。
 */
// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMediaAi } from './useMediaAi';
import { IMAGE_INLINE_LIMIT_BYTES } from '../services/gemini/caption';
import { KEY_SOURCE_STORAGE, OWN_KEY_STORAGE, PEER_KEY_STORAGE } from '../services/gemini/keyStore';
import type { MediaAiResult } from './useMediaAi';

vi.mock('../services/gemini/caption', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/gemini/caption')>();
  return { ...actual, generateMediaCaption: vi.fn() };
});

// eslint-disable-next-line import/first -- vi.mock 提升,import 須在其後拿 mock
import { generateMediaCaption } from '../services/gemini/caption';

const generateMock = vi.mocked(generateMediaCaption);

const pngFile = () => new File([new Uint8Array([137, 80, 78, 71])], 'a.png', { type: 'image/png' });

beforeEach(() => {
  localStorage.clear();
  generateMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('useMediaAi 前置檢查(不發請求)', () => {
  it('無金鑰 → no_key,不呼叫 Gemini', async () => {
    const { result } = renderHook(() => useMediaAi());

    let outcome: MediaAiResult | undefined;
    await act(async () => {
      outcome = await result.current.generate(pngFile());
    });

    expect(outcome).toEqual({ ok: false, code: 'no_key' });
    expect(result.current.state).toEqual({ phase: 'error', errorCode: 'no_key' });
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('勾選文管庫來源但對方金鑰已不存在 → peer_key_missing(可行動的專屬碼)', async () => {
    localStorage.setItem(KEY_SOURCE_STORAGE, 'peer');
    const { result } = renderHook(() => useMediaAi());

    let outcome: MediaAiResult | undefined;
    await act(async () => {
      outcome = await result.current.generate(pngFile());
    });

    expect(outcome).toEqual({ ok: false, code: 'peer_key_missing' });
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('影片檔 → unsupported_kind(一期只支援圖片)', async () => {
    localStorage.setItem(OWN_KEY_STORAGE, 'AQ.key');
    const { result } = renderHook(() => useMediaAi());
    const mp4 = new File([new Uint8Array([0])], 'v.mp4', { type: 'video/mp4' });

    let outcome: MediaAiResult | undefined;
    await act(async () => {
      outcome = await result.current.generate(mp4);
    });

    expect(outcome).toEqual({ ok: false, code: 'unsupported_kind' });
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('圖片超過 15MB → image_too_large', async () => {
    localStorage.setItem(OWN_KEY_STORAGE, 'AQ.key');
    const { result } = renderHook(() => useMediaAi());
    const big = new File([new Uint8Array(4)], 'big.png', { type: 'image/png' });
    Object.defineProperty(big, 'size', { value: IMAGE_INLINE_LIMIT_BYTES + 1 });

    let outcome: MediaAiResult | undefined;
    await act(async () => {
      outcome = await result.current.generate(big);
    });

    expect(outcome).toEqual({ ok: false, code: 'image_too_large' });
    expect(generateMock).not.toHaveBeenCalled();
  });
});

describe('useMediaAi 生成路徑', () => {
  it('本機金鑰:帶 key/base64/mimeType/signal 呼叫;成功 → done 含說明與標籤', async () => {
    localStorage.setItem(OWN_KEY_STORAGE, 'AQ.own');
    generateMock.mockResolvedValue({ ok: true, caption: '山景說明', tags: ['#山景', '#走走'] });
    const { result } = renderHook(() => useMediaAi());

    let outcome: MediaAiResult | undefined;
    await act(async () => {
      outcome = await result.current.generate(pngFile());
    });

    expect(outcome).toEqual({ ok: true, result: { caption: '山景說明', tags: ['#山景', '#走走'] } });
    expect(result.current.state).toEqual({ phase: 'done', result: { caption: '山景說明', tags: ['#山景', '#走走'] } });
    expect(generateMock).toHaveBeenCalledTimes(1);
    const arg = generateMock.mock.calls[0][0];
    expect(arg.apiKey).toBe('AQ.own');
    expect(arg.mimeType).toBe('image/png');
    // FileReader data URL 去前綴:拿到的是純 base64(非空、不含 data: 前綴)
    expect(arg.imageBase64.length).toBeGreaterThan(0);
    expect(arg.imageBase64).not.toContain('data:');
    expect(arg.signal).toBeInstanceOf(AbortSignal);
  });

  it('勾選文管庫來源 → 以文管庫金鑰呼叫(IA-D8:唯讀、用完即棄)', async () => {
    localStorage.setItem(KEY_SOURCE_STORAGE, 'peer');
    localStorage.setItem(PEER_KEY_STORAGE, 'AIza.peer');
    generateMock.mockResolvedValue({ ok: true, caption: 'x', tags: [] });
    const { result } = renderHook(() => useMediaAi());

    await act(async () => {
      await result.current.generate(pngFile());
    });

    expect(generateMock.mock.calls[0][0].apiKey).toBe('AIza.peer');
  });

  it('失敗 → error 帶錯誤碼', async () => {
    localStorage.setItem(OWN_KEY_STORAGE, 'AQ.own');
    generateMock.mockResolvedValue({ ok: false, code: 'quota' });
    const { result } = renderHook(() => useMediaAi());

    let outcome: MediaAiResult | undefined;
    await act(async () => {
      outcome = await result.current.generate(pngFile());
    });

    expect(outcome).toEqual({ ok: false, code: 'quota' });
    expect(result.current.state).toEqual({ phase: 'error', errorCode: 'quota' });
  });

  it('停止:stop() 中止 signal,流程以 aborted 收尾(顯示「已停止」非網路錯誤)', async () => {
    localStorage.setItem(OWN_KEY_STORAGE, 'AQ.own');
    let resolveGen!: (v: { ok: false; code: 'aborted' }) => void;
    generateMock.mockReturnValue(
      new Promise((res) => {
        resolveGen = res;
      }),
    );
    const { result } = renderHook(() => useMediaAi());

    let outcomePromise!: Promise<MediaAiResult>;
    act(() => {
      outcomePromise = result.current.generate(pngFile());
    });
    await vi.waitFor(() => expect(generateMock).toHaveBeenCalled());
    const signal = generateMock.mock.calls[0][0].signal as AbortSignal;

    act(() => {
      result.current.stop();
    });
    expect(signal.aborted).toBe(true);

    let outcome: MediaAiResult | undefined;
    await act(async () => {
      resolveGen({ ok: false, code: 'aborted' });
      outcome = await outcomePromise;
    });
    expect(outcome).toEqual({ ok: false, code: 'aborted' });
    expect(result.current.state).toEqual({ phase: 'error', errorCode: 'aborted' });
  });
});

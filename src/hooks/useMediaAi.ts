/**
 * 看圖生說明的狀態機 hook(M-PLAN D8 一期):busy/done/error 三相 + 停止鈕。
 * 鏡像文管庫 D15 慣例——AbortController 中止,aborted 顯示「已停止」非網路錯誤。
 * 金鑰解析走 keyStore(IA-D8 可勾選文管庫金鑰);錯誤碼含金鑰前置檢查
 * (no_key / peer_key_missing)與輸入資格(unsupported_kind / image_too_large)。
 */
import { useCallback, useRef, useState } from 'react';
import {
  checkImageEligible,
  generateMediaCaption,
  type CaptionErrorCode,
} from '../services/gemini/caption';
import { resolveActiveKey } from '../services/gemini/keyStore';
import { detectMediaKind } from '../utils/mediaKind';

export type MediaAiErrorCode = CaptionErrorCode | 'no_key' | 'peer_key_missing' | 'unsupported_kind' | 'image_too_large';

export interface MediaAiOutcome {
  caption: string;
  tags: string[];
}

export type MediaAiState =
  | { phase: 'idle' }
  | { phase: 'busy' }
  | { phase: 'done'; result: MediaAiOutcome }
  | { phase: 'error'; errorCode: MediaAiErrorCode };

export type MediaAiResult =
  | { ok: true; result: MediaAiOutcome }
  | { ok: false; code: MediaAiErrorCode };

/** File → 純 base64(FileReader data URL 去前綴);DOM 依賴集中在這。 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      const comma = dataUrl.indexOf(',');
      resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function useMediaAi() {
  const [state, setState] = useState<MediaAiState>({ phase: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const generate = useCallback(async (file: File): Promise<MediaAiResult> => {
    const kind = detectMediaKind(file.type, file.name);
    const ineligible = checkImageEligible({ kind, size: file.size });
    if (ineligible) {
      setState({ phase: 'error', errorCode: ineligible });
      return { ok: false, code: ineligible };
    }
    const { key, source } = resolveActiveKey();
    if (!key) {
      // 勾了文管庫但對方端已清除:給可行動的專屬碼,不淹沒在通用「未設定」裡
      const code = source === 'peer' ? 'peer_key_missing' : 'no_key';
      setState({ phase: 'error', errorCode: code });
      return { ok: false, code };
    }
    setState({ phase: 'busy' });
    const controller = new AbortController();
    abortRef.current = controller;
    let base64: string;
    try {
      base64 = await fileToBase64(file);
    } catch {
      setState({ phase: 'error', errorCode: 'unknown' });
      return { ok: false, code: 'unknown' };
    }
    const outcome = await generateMediaCaption({
      apiKey: key,
      imageBase64: base64,
      mimeType: file.type || 'image/jpeg',
      signal: controller.signal,
    });
    abortRef.current = null;
    if (outcome.ok) {
      setState({ phase: 'done', result: { caption: outcome.caption, tags: outcome.tags } });
      return { ok: true, result: { caption: outcome.caption, tags: outcome.tags } };
    }
    setState({ phase: 'error', errorCode: outcome.code });
    return { ok: false, code: outcome.code };
  }, []);

  const reset = useCallback(() => {
    setState({ phase: 'idle' });
  }, []);

  return { state, generate, stop, reset };
}

/**
 * Gemini 看圖生說明(M-PLAN D8 一期,BYOK):把選好的圖片 inline 送進
 * generateContent,產出「FB 貼文說明 + 建議標籤」。呼叫形狀刻意與文管庫
 * rewrite.ts 完全一致(同端點、同模型降級迴圈、同錯誤對應)——兩庫共用
 * 同一份金鑰池與配額,行為一致才好一起 debug。
 *
 * 圖片以 base64 inline 傳遞(docs 查證 2026-11-20:generateContent 的
 * `parts[].inlineData`,請求總上限 20MB;base64 膨脹約 4/3,原檔閘 15MB)。
 * 純邏輯(prompt 組裝/回應解析/狀態碼對應)與 DOM 依賴(模型記憶的
 * localStorage)集中於此;金鑰存取見 keyStore.ts(D8 二期不動)。
 */
import type { MediaKind } from '../../types';

/**
 * 模型候選(依序嘗試)——與文管庫 rewrite.ts 同一份清單:兩庫同一把
 * 金鑰池,候選順序一致可讓「已探測模型」的經驗在兩庫行為對齊。
 * 404 = 換下一個;400/401/403 = key 問題,直接結束。
 */
export const GEMINI_MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-2.0-flash',
] as const;

export type CaptionErrorCode =
  | 'invalid_key'
  | 'quota'
  | 'server'
  | 'network'
  | 'no_content'
  | 'model_unavailable'
  | 'aborted'
  | 'unknown';

/** 模型候選間的換檔等待(讓限流窗口呼吸;免費方案常見 429/503 過載)。 */
export const GEMINI_FALLBACK_DELAY_MS = 800;

/**
 * inline 圖片原檔大小閘:Gemini inline 請求總上限 20MB,base64 編碼膨脹
 * 約 4/3 倍,15MB 原檔 + prompt 仍在上限內(留餘裕,誠實拒絕而非送出被退)。
 */
export const IMAGE_INLINE_LIMIT_BYTES = 15 * 1024 * 1024;

export type CaptionResult =
  | { ok: true; caption: string; tags: string[] }
  | { ok: false; code: CaptionErrorCode };

/** 輸入資格檢查(純函式):一期只吃圖片——影片 inline 裝不進 20MB,誠實不支援。 */
export function checkImageEligible(input: { kind: MediaKind; size: number }): 'unsupported_kind' | 'image_too_large' | null {
  if (input.kind !== 'image') return 'unsupported_kind';
  if (input.size > IMAGE_INLINE_LIMIT_BYTES) return 'image_too_large';
  return null;
}

export function buildCaptionPrompt(limit?: number): string {
  const lines = [
    '你是社群媒體文案編輯。請看這張圖片,為它寫一篇適合 Facebook 粉專的繁體中文貼文說明。',
    '規則:',
    '- 只描述圖片中實際可見的內容,不臆測拍攝地點、場合或人物身份',
    '- 語氣親切自然,適合粉絲專頁發文,可適度使用 emoji',
    '- 圖片若含明顯文字(如海報、標語),可如實引用;看不清楚就不要編造',
    '- 說明以兩到四行為原則,精簡有畫面感',
    '- 最後一行輸出建議標籤,格式固定為「標籤: #標籤1 #標籤2 #標籤3」(3~5 個,以圖片內容為本)',
    '- 只輸出說明與標籤行,不要任何前言、說明或引號',
  ];
  if (limit && limit > 0) lines.push(`- 說明總長度不得超過 ${limit} 字(不含標籤行)`);
  return lines.join('\n');
}

/**
 * 解析模型回覆:從尾端往前找第一個「標籤:」行(防模型把標籤行放中間),
 * 其前為說明本體、其內的 #tag 為標籤(去重保序);沒有標籤行=全文都是說明。
 */
export function parseCaptionReply(text: string): { caption: string; tags: string[] } {
  const lines = text.trim().split(/\r?\n/);
  let tagIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^\s*標籤\s*[:：]/.test(lines[i])) {
      tagIndex = i;
      break;
    }
  }
  const tagLine = tagIndex >= 0 ? lines[tagIndex] : null;
  const captionLines = tagIndex >= 0 ? lines.slice(0, tagIndex) : lines;
  const caption = captionLines.join('\n').trim();
  const tags: string[] = [];
  if (tagLine) {
    for (const m of tagLine.match(/#[^\s#]+/g) ?? []) {
      if (!tags.includes(m)) tags.push(m);
    }
  }
  return { caption, tags };
}

/** 從 generateContent 回應 JSON 取出文字;結構不符回 null(與文管庫同型)。 */
export function parseGeminiReply(json: unknown): string | null {
  const candidates = (json as { candidates?: unknown[] })?.candidates;
  const parts = (candidates?.[0] as { content?: { parts?: Array<{ text?: string }> } })?.content
    ?.parts;
  const text = parts?.map((p) => p?.text ?? '').join('').trim();
  return text || null;
}

/** fetch 回應的 HTTP 狀態 → 錯誤碼(純函式,與文管庫同對應)。 */
export function statusToCode(status: number): CaptionErrorCode {
  if (status === 401 || status === 403) return 'invalid_key';
  if (status === 400) return 'invalid_key';
  if (status === 404) return 'model_unavailable';
  if (status === 429) return 'quota';
  if (status >= 500) return 'server';
  return 'unknown';
}

/** 已探測可用的模型(存 localStorage,之後直接用;不在 IA-D8 契約內,兩庫各自記)。 */
const MODEL_STORAGE = 'media-message:gemini-model';

function loadResolvedModel(): string {
  try {
    return localStorage.getItem(MODEL_STORAGE) ?? '';
  } catch {
    return '';
  }
}

function saveResolvedModel(model: string): void {
  try {
    localStorage.setItem(MODEL_STORAGE, model);
  } catch {
    // 記不住就每次重試,不影響功能
  }
}

/** 看圖生說明:模型候選逐一降級(文管庫 generateContent 的多模態版)。 */
export async function generateMediaCaption(input: {
  apiKey: string;
  imageBase64: string;
  mimeType: string;
  limit?: number;
  signal?: AbortSignal;
}): Promise<CaptionResult> {
  const prompt = buildCaptionPrompt(input.limit);
  const body = JSON.stringify({
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: input.mimeType, data: input.imageBase64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  });
  const candidates = [loadResolvedModel(), ...GEMINI_MODEL_CANDIDATES].filter(
    (m, i, arr): m is string => !!m && arr.indexOf(m) === i,
  );

  let lastCode: CaptionErrorCode = 'unknown';
  for (const model of candidates) {
    let resp: Response;
    try {
      resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': input.apiKey },
          body,
          signal: input.signal,
        },
      );
    } catch (err) {
      // 使用者按下「停止」:中止不是錯誤,回專屬碼供 UI 顯示「已停止」
      if (err instanceof Error && err.name === 'AbortError') return { ok: false, code: 'aborted' };
      return { ok: false, code: 'network' };
    }
    if (!resp.ok) {
      lastCode = statusToCode(resp.status);
      console.error(`[gemini] ${model} → HTTP ${resp.status}`);
      // 404(此 key 無此模型)、429(限流)、5xx(過載)→ 換下一個候選再試;
      // key 問題(400/401/403)換模型也沒救,立即結束(與文管庫同策略)
      if (lastCode === 'invalid_key') return { ok: false, code: lastCode };
      await new Promise((r) => setTimeout(r, GEMINI_FALLBACK_DELAY_MS));
      continue;
    }
    let json: unknown;
    try {
      json = await resp.json();
    } catch {
      lastCode = 'unknown';
      continue;
    }
    const text = parseGeminiReply(json);
    if (text) {
      saveResolvedModel(model);
      return { ok: true, ...parseCaptionReply(text) };
    }
    lastCode = 'no_content';
  }
  return { ok: false, code: lastCode };
}

/**
 * Graph API 串接(粉專媒體發佈;fetch 可注入,純邏輯可測——單元測試斷言完整請求形狀)。
 * 全程瀏覽器直傳(D7:零後端、零 secrets);token 一律以參數傳遞、不落地。
 *
 * 三條路徑(2026-10-05 逐項查證官方文件):
 * 1. 粉專清單:GET /me/accounts(fields=id,name,access_token)
 *    https://developers.facebook.com/docs/graph-api/reference/user/accounts/
 *    ——page id 從原始回應文字抽取(錨定法,見 listPages)防 JSON number 超 2^53 失真
 * 2. 圖片:POST /{page-id}/photos,source=multipart 直傳
 *    https://developers.facebook.com/docs/graph-api/reference/page/photos/
 *    ——圖檔 ≤4MB、格式 jpeg/bmp/png/gif/tiff;排程=published=false+scheduled_publish_time
 * 3. 影片:POST /{page-id}/videos,source=multipart 單請求直傳(XHR 追蹤上傳進度)
 *    https://developers.facebook.com/docs/graph-api/reference/page/videos/
 *    ——2026-10-19 真機驗收改版:原 Resumable Upload API 三步之第二步
 *    POST /upload:{session}(Authorization+file_offset 自訂標頭)觸發 CORS 預檢,
 *    該端點不回 Access-Control-Allow-Origin——瀏覽器端無解(Meta 開發者社群同案),
 *    改為與圖片 photos 同構的 source multipart 單請求(v26.0 文件 source 明載必填)。
 */
import { FB_GRAPH_BASE } from './config';
import { FacebookError, fromGraphResponse } from './errors';
import { toScheduleSeconds } from './schedule';

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

/** 粉專憑證:page access token 僅存呼叫端記憶體(hook 的 ref),不進 React state、不落地。 */
export interface FacebookPageCredential {
  pageId: string;
  pageName: string;
  accessToken: string;
}

async function readGraphJson(
  resp: Response,
  label: string,
): Promise<{ text: string; data: Record<string, unknown> }> {
  const text = await resp.text();
  if (!resp.ok) throw fromGraphResponse(resp.status, text);
  try {
    return { text, data: JSON.parse(text) as Record<string, unknown> };
  } catch {
    throw new FacebookError('parse', `facebook ${label} non-json response: ${text.slice(0, 200)}`);
  }
}

function requireString(data: Record<string, unknown>, key: string, label: string): string {
  const value = data[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new FacebookError('parse', `facebook ${label}: missing ${key}`);
  }
  return value;
}

/**
 * 使用者管理的粉專清單(fields=id,name,access_token)。
 * page id 依串接紀律從原始回應文字抽取——/me/accounts 的 id 可能是 JSON number
 * 且超 JS 安全整數(文管庫 BACKEND.md §6 案例);以每頁唯一的 access_token 為錨,
 * 向前找最近的 "id" 即同一物件內的 id(fields 順序保證 id 在 token 前)。
 */
export async function listPages(
  opts: { userAccessToken: string },
  fetcher: Fetcher = fetch,
): Promise<FacebookPageCredential[]> {
  const params = new URLSearchParams({
    fields: 'id,name,access_token',
    access_token: opts.userAccessToken,
  });
  const resp = await fetcher(`${FB_GRAPH_BASE}/me/accounts?${params.toString()}`);
  const { text, data } = await readGraphJson(resp, 'me/accounts');
  const items = Array.isArray(data.data) ? (data.data as Array<Record<string, unknown>>) : [];
  const pages: FacebookPageCredential[] = [];
  for (const item of items) {
    if (typeof item.access_token !== 'string' || typeof item.name !== 'string') continue;
    const anchor = text.indexOf(`"access_token":"${item.access_token}"`);
    let pageId: string | null = null;
    if (anchor > 0) {
      const ids = [...text.slice(0, anchor).matchAll(/"id"\s*:\s*"?(\d+)"?/g)];
      pageId = ids.length ? (ids[ids.length - 1][1] as string) : null;
    }
    if (!pageId) pageId = typeof item.id === 'string' && /^\d+$/.test(item.id) ? item.id : null;
    if (!pageId) continue;
    pages.push({ pageId, pageName: item.name, accessToken: item.access_token });
  }
  return pages;
}

/** 圖片直傳:POST /{page-id}/photos(source=multipart;access_token 走 query 參數)。 */
export async function publishPhoto(
  opts: {
    pageId: string;
    pageToken: string;
    file: File;
    caption: string;
    /** 有值=原生排程(published=false + scheduled_publish_time,秒)。 */
    scheduledAtMs?: number;
  },
  fetcher: Fetcher = fetch,
): Promise<{ photoId: string; postId: string | null }> {
  const form = new FormData();
  form.append('source', opts.file, opts.file.name);
  form.append('caption', opts.caption);
  if (typeof opts.scheduledAtMs === 'number') {
    form.append('published', 'false');
    form.append('scheduled_publish_time', toScheduleSeconds(opts.scheduledAtMs));
  }
  const url = `${FB_GRAPH_BASE}/${opts.pageId}/photos?access_token=${encodeURIComponent(opts.pageToken)}`;
  const resp = await fetcher(url, { method: 'POST', body: form });
  const { data } = await readGraphJson(resp, 'photo publish');
  return {
    photoId: requireString(data, 'id', 'photo publish'),
    postId: typeof data.post_id === 'string' ? data.post_id : null,
  };
}

/** 組裝影片發佈請求(純邏輯;單元測試斷言完整請求形狀)。 */
export function buildVideoPublishRequest(opts: {
  pageId: string;
  pageToken: string;
  file: File;
  description: string;
  /** 有值=原生排程(published=false + scheduled_publish_time,秒;影片窗口 10 分鐘~6 個月)。 */
  scheduledAtMs?: number;
}): { url: string; form: FormData } {
  const form = new FormData();
  form.append('source', opts.file, opts.file.name);
  form.append('description', opts.description);
  if (typeof opts.scheduledAtMs === 'number') {
    form.append('published', 'false');
    form.append('scheduled_publish_time', toScheduleSeconds(opts.scheduledAtMs));
  }
  const url = `${FB_GRAPH_BASE}/${opts.pageId}/videos?access_token=${encodeURIComponent(opts.pageToken)}`;
  return { url, form };
}

/**
 * 影片直傳:POST /{page-id}/videos(source=multipart 單請求;access_token 走 query 參數)。
 * fetch 無法追蹤上傳進度,故用 XHR(鏡像文管庫 YouTube 上傳);
 * 回應 id=video id;title 為選用參數,本產品說明單一欄位對應 description。
 */
export function publishVideo(opts: {
  pageId: string;
  pageToken: string;
  file: File;
  description: string;
  scheduledAtMs?: number;
  onProgress?: (fraction: number) => void;
}): Promise<{ videoId: string }> {
  const { url, form } = buildVideoPublishRequest(opts);
  return new Promise<{ videoId: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && opts.onProgress) opts.onProgress(e.loaded / e.total);
    };
    xhr.onerror = () => reject(new FacebookError('network', 'video upload request failed'));
    xhr.ontimeout = () => reject(new FacebookError('network', 'video upload timed out'));
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(fromGraphResponse(xhr.status, xhr.responseText ?? ''));
        return;
      }
      try {
        const data = JSON.parse(xhr.responseText) as Record<string, unknown>;
        if (typeof data.id !== 'string' || data.id.length === 0) throw new Error('missing id');
        resolve({ videoId: data.id });
      } catch {
        reject(
          new FacebookError(
            'parse',
            `facebook video publish bad response: ${(xhr.responseText ?? '').slice(0, 200)}`,
          ),
        );
      }
    };
    xhr.send(form);
  });
}

/** Page Photos 文件明載的圖檔限制:.jpeg/.bmp/.png/.gif/.tiff、≤4MB(PNG 建議 ≤1MB 防縮圖失真)。 */
export const PHOTO_MAX_BYTES = 4 * 1024 * 1024;
const PHOTO_EXTENSIONS = new Set(['jpeg', 'jpg', 'bmp', 'png', 'gif', 'tiff', 'tif']);
const PHOTO_MIME_TYPES = new Set([
  'image/jpeg',
  'image/bmp',
  'image/png',
  'image/gif',
  'image/tiff',
]);

/** 圖片檔驗證(格式+大小;純邏輯)。通過回 null。 */
export function validatePhotoFile(file: { name: string; type: string; size: number }): FacebookError | null {
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
  const ok = PHOTO_MIME_TYPES.has(file.type.toLowerCase()) || PHOTO_EXTENSIONS.has(ext);
  if (!ok) return new FacebookError('invalid_file', `photo format: ${file.type || ext}`);
  if (file.size > PHOTO_MAX_BYTES) return new FacebookError('invalid_file', `photo size ${file.size} > 4MB`);
  return null;
}

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
 * 3. 影片(現行 Resumable Upload API 三步,官方發佈指南):
 *    ① POST /{app-id}/uploads(file_name/file_length/file_type)→ upload session id
 *    ② POST /upload:{session}(Authorization: OAuth 標頭、file_offset 標頭、二進位 body)→ file handle
 *    ③ POST graph-video/{page-id}/videos(fbuploader_video_file_chunk=handle、description、排程參數)→ video id
 *    https://developers.facebook.com/docs/graph-api/guides/upload
 *    https://developers.facebook.com/docs/video-api/guides/publishing
 *    https://developers.facebook.com/docs/graph-api/reference/page/videos/
 */
import { FB_APP_ID, FB_GRAPH_BASE, FB_GRAPH_VIDEO_BASE } from './config';
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

/** 影片上傳①:建立上傳 session(POST /{app-id}/uploads;user token)。 */
export async function startVideoUpload(
  opts: {
    appId?: string;
    fileName: string;
    fileLength: number;
    fileType: string;
    userAccessToken: string;
  },
  fetcher: Fetcher = fetch,
): Promise<string> {
  const body = new URLSearchParams({
    file_name: opts.fileName,
    file_length: String(opts.fileLength),
    file_type: opts.fileType,
    access_token: opts.userAccessToken,
  });
  const resp = await fetcher(`${FB_GRAPH_BASE}/${opts.appId ?? FB_APP_ID}/uploads`, {
    method: 'POST',
    body,
  });
  const { data } = await readGraphJson(resp, 'video upload start');
  // 回應形如 {"id":"upload:<SESSION_ID>"}
  return requireString(data, 'id', 'video upload start');
}

/**
 * 影片上傳②:傳輸二進位(POST /upload:{session};file_offset 標頭=位元組偏移)。
 * fetch 無法追蹤上傳進度,故用 XHR(鏡像文管庫 YouTube 上傳);
 * 斷點續傳(v2):GET /upload:{session} 查詢當前 file_offset 後由此偏移續傳。
 */
export function uploadVideoBytes(opts: {
  sessionId: string;
  userAccessToken: string;
  file: Blob;
  onProgress?: (fraction: number) => void;
}): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${FB_GRAPH_BASE}/${opts.sessionId}`);
    xhr.setRequestHeader('Authorization', `OAuth ${opts.userAccessToken}`);
    xhr.setRequestHeader('file_offset', '0');
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && opts.onProgress) opts.onProgress(e.loaded / e.total);
    };
    xhr.onerror = () => reject(new FacebookError('network', 'video transfer request failed'));
    xhr.ontimeout = () => reject(new FacebookError('network', 'video transfer timed out'));
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(fromGraphResponse(xhr.status, xhr.responseText ?? ''));
        return;
      }
      try {
        const data = JSON.parse(xhr.responseText) as { h?: string };
        if (!data.h) throw new Error('no h');
        resolve(data.h);
      } catch {
        reject(new FacebookError('parse', 'cannot parse video file handle'));
      }
    };
    xhr.send(opts.file);
  });
}

/**
 * 影片上傳③:發佈(POST graph-video/{page-id}/videos;file handle + 說明 + 排程)。
 * title 為選用參數,本產品說明單一欄位對應 description。
 */
export async function publishVideo(
  opts: {
    pageId: string;
    pageToken: string;
    fileHandle: string;
    description: string;
    scheduledAtMs?: number;
  },
  fetcher: Fetcher = fetch,
): Promise<{ videoId: string }> {
  const form = new FormData();
  form.append('access_token', opts.pageToken);
  form.append('fbuploader_video_file_chunk', opts.fileHandle);
  form.append('description', opts.description);
  if (typeof opts.scheduledAtMs === 'number') {
    form.append('published', 'false');
    form.append('scheduled_publish_time', toScheduleSeconds(opts.scheduledAtMs));
  }
  const resp = await fetcher(`${FB_GRAPH_VIDEO_BASE}/${opts.pageId}/videos`, {
    method: 'POST',
    body: form,
  });
  const { data } = await readGraphJson(resp, 'video publish');
  return { videoId: requireString(data, 'id', 'video publish') };
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

import { describe, expect, it } from 'vitest';
import { FB_GRAPH_BASE, FB_GRAPH_VERSION, FB_GRAPH_VIDEO_BASE } from './config';
import { FacebookError } from './errors';
import {
  listPages,
  publishPhoto,
  publishVideo,
  startVideoUpload,
  validatePhotoFile,
} from './graph';

/** 錄製請求形狀的假 fetcher(串接紀律:斷言 URL、method、每個欄位名)。每次呼叫新建 Response(body 不可重讀)。 */
type FakeResponse = { raw?: string; json?: unknown; status?: number };

function recorder(...responses: FakeResponse[]) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  let i = 0;
  const fetcher = async (url: string, init?: RequestInit): Promise<Response> => {
    calls.push({ url, init });
    const spec = responses[Math.min(i++, responses.length - 1)]!;
    const body = spec.raw ?? JSON.stringify(spec.json ?? {});
    return new Response(body, {
      status: spec.status ?? 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  return { calls, fetcher };
}

describe('listPages(/me/accounts)', () => {
  it('請求形狀:v26.0 路徑、fields、access_token', async () => {
    const { calls, fetcher } = recorder({ json: { data: [] } });
    await listPages({ userAccessToken: 'USER_T' }, fetcher);
    const u = new URL(calls[0]!.url);
    expect(`${u.origin}${u.pathname}`).toBe(`${FB_GRAPH_BASE}/me/accounts`);
    expect(u.pathname).toContain(`/${FB_GRAPH_VERSION}/`);
    expect(u.searchParams.get('fields')).toBe('id,name,access_token');
    expect(u.searchParams.get('access_token')).toBe('USER_T');
  });

  it('錨定抽取:id 為超過 2^53 的 JSON number 時不失真;字串 id 亦可用', async () => {
    // 頁 A 的 id 是未加引號的 17 位數(JSON.parse 會失真);頁 B 是字串;後方 paging 另有引號物件
    const raw =
      '{"data":[' +
      '{"id":10000000000000001,"name":"頁 A","access_token":"TOKEN_A"},' +
      '{"id":"10000000000000002","name":"頁 B","access_token":"TOKEN_B"}' +
      '],"paging":{"cursors":{"before":"1","after":"2"}}}';
    const { fetcher } = recorder({ raw });
    const pages = await listPages({ userAccessToken: 'USER_T' }, fetcher);
    expect(pages).toHaveLength(2);
    expect(pages[0]).toEqual({
      pageId: '10000000000000001',
      pageName: '頁 A',
      accessToken: 'TOKEN_A',
    });
    expect(pages[1]!.pageId).toBe('10000000000000002');
  });

  it('缺 access_token 或 name 的項目整列跳過', async () => {
    const raw =
      '{"data":[{"id":"123","name":"無 token 頁"},{"id":"456","access_token":"T","name":"正常頁"}]}';
    const { fetcher } = recorder({ raw });
    const pages = await listPages({ userAccessToken: 'USER_T' }, fetcher);
    expect(pages).toHaveLength(1);
    expect(pages[0]!.pageId).toBe('456');
  });
});

describe('publishPhoto(/{page-id}/photos multipart)', () => {
  const file = new File([new Uint8Array([1, 2, 3])], '相片.jpg', { type: 'image/jpeg' });

  it('立即發佈:FormData 只有 source+caption,token 走 query;回應 id/post_id', async () => {
    const { calls, fetcher } = recorder({ json: { id: '111', post_id: '222_333' } });
    const result = await publishPhoto(
      { pageId: 'PAGE_1', pageToken: 'PAGE_T', file, caption: '今日風景' },
      fetcher,
    );
    const u = new URL(calls[0]!.url);
    expect(`${u.origin}${u.pathname}`).toBe(`${FB_GRAPH_BASE}/PAGE_1/photos`);
    expect(u.searchParams.get('access_token')).toBe('PAGE_T');
    expect(calls[0]!.init?.method).toBe('POST');
    const form = calls[0]!.init!.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    const source = form.get('source');
    expect(source).toBeInstanceOf(File);
    expect((source as File).name).toBe('相片.jpg');
    expect((source as File).size).toBe(3);
    expect(form.get('caption')).toBe('今日風景');
    expect(form.get('published')).toBeNull();
    expect(form.get('scheduled_publish_time')).toBeNull();
    expect(result).toEqual({ photoId: '111', postId: '222_333' });
  });

  it('排程:published=false + scheduled_publish_time(秒,int64 文件型別)', async () => {
    const { calls, fetcher } = recorder({ json: { id: '111' } });
    await publishPhoto(
      { pageId: 'PAGE_1', pageToken: 'PAGE_T', file, caption: 'c', scheduledAtMs: 1767225600123 },
      fetcher,
    );
    const form = calls[0]!.init!.body as FormData;
    expect(form.get('published')).toBe('false');
    expect(form.get('scheduled_publish_time')).toBe('1767225600'); // 毫秒→秒,捨去
  });
});

describe('影片三步(Resumable Upload API)', () => {
  it('① start:POST /{app-id}/uploads,file_name/file_length/file_type/access_token', async () => {
    const { calls, fetcher } = recorder({ json: { id: 'upload:ABC123' } });
    const sessionId = await startVideoUpload(
      {
        appId: '1808247027192643',
        fileName: '短片.mp4',
        fileLength: 1024,
        fileType: 'video/mp4',
        userAccessToken: 'USER_T',
      },
      fetcher,
    );
    const u = new URL(calls[0]!.url);
    expect(`${u.origin}${u.pathname}`).toBe(`${FB_GRAPH_BASE}/1808247027192643/uploads`);
    expect(calls[0]!.init?.method).toBe('POST');
    const body = calls[0]!.init!.body as URLSearchParams;
    expect(body).toBeInstanceOf(URLSearchParams);
    expect(body.get('file_name')).toBe('短片.mp4');
    expect(body.get('file_length')).toBe('1024');
    expect(body.get('file_type')).toBe('video/mp4');
    expect(body.get('access_token')).toBe('USER_T');
    expect(sessionId).toBe('upload:ABC123');
  });

  it('③ publish:graph-video 主機,fbuploader_video_file_chunk=handle+description;排程帶 published=false', async () => {
    const { calls, fetcher } = recorder(
      { json: { id: '987654' } },
      { json: { id: '987655' } },
    );
    const r1 = await publishVideo(
      {
        pageId: 'PAGE_1',
        pageToken: 'PAGE_T',
        fileHandle: '2:c2FtcGxl',
        description: '影片說明',
      },
      fetcher,
    );
    expect(r1).toEqual({ videoId: '987654' });
    expect(calls[0]!.url).toBe(`${FB_GRAPH_VIDEO_BASE}/PAGE_1/videos`);
    expect(calls[0]!.init?.method).toBe('POST');
    let form = calls[0]!.init!.body as FormData;
    expect(form.get('access_token')).toBe('PAGE_T');
    expect(form.get('fbuploader_video_file_chunk')).toBe('2:c2FtcGxl');
    expect(form.get('description')).toBe('影片說明');
    expect(form.get('published')).toBeNull();

    await publishVideo(
      {
        pageId: 'PAGE_1',
        pageToken: 'PAGE_T',
        fileHandle: '2:c2FtcGxl',
        description: 'd',
        scheduledAtMs: 1767225600000,
      },
      fetcher,
    );
    form = calls[1]!.init!.body as FormData;
    expect(form.get('published')).toBe('false');
    expect(form.get('scheduled_publish_time')).toBe('1767225600');
  });
});

describe('Graph 錯誤分類(fromGraphResponse)', () => {
  it('code 190 → expired;code 200 → permission;保留伺服器訊息', async () => {
    const { fetcher } = recorder({ json: { error: { message: 'Session expired', code: 190 } }, status: 400 });
    await expect(listPages({ userAccessToken: 'T' }, fetcher)).rejects.toMatchObject({
      code: 'expired',
      message: 'Session expired',
    });

    const { fetcher: f2 } = recorder({
      json: { error: { message: 'Permissions error', code: 200 } },
      status: 403,
    });
    await expect(listPages({ userAccessToken: 'T' }, f2)).rejects.toMatchObject({
      code: 'permission',
    });
  });

  it('非 JSON 錯誤回應 → parse', async () => {
    const { fetcher } = recorder({ raw: '<html>502</html>', status: 502 });
    await expect(listPages({ userAccessToken: 'T' }, fetcher)).rejects.toBeInstanceOf(FacebookError);
  });
});

describe('validatePhotoFile(文件明載:格式與 4MB 上限)', () => {
  it('格式與大小通過/拒絕', () => {
    expect(validatePhotoFile({ name: 'a.jpg', type: 'image/jpeg', size: 1000 })).toBeNull();
    // MIME 缺漏時以副檔名判定
    expect(validatePhotoFile({ name: 'b.png', type: '', size: 1000 })).toBeNull();
    expect(
      validatePhotoFile({ name: 'c.heic', type: 'image/heic', size: 1000 }),
    ).toMatchObject({ code: 'invalid_file' });
    expect(
      validatePhotoFile({ name: 'd.png', type: 'image/png', size: 4 * 1024 * 1024 + 1 }),
    ).toMatchObject({ code: 'invalid_file' });
    expect(
      validatePhotoFile({ name: 'e.png', type: 'image/png', size: 4 * 1024 * 1024 }),
    ).toBeNull();
  });
});

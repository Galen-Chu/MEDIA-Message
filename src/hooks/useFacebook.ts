/**
 * Facebook 連線狀態機(鏡像文管庫 useGmail/useYoutube 的狀態模型):
 * - disabled(env 未設)= 降級建置;disconnected/connecting/connected/error
 * - user token 僅存 useRef(不進 React state、不落地);過期即要求重新連線
 *   (implicit flow 無 refresh token,誠實導向重連而非靜默續約)
 * - page token 同樣僅記憶體;中斷連線即 FB.logout(盡力)
 */
import { useCallback, useRef, useState } from 'react';
import { FB_APP_ID, FB_ENABLED } from '../services/facebook/config';
import { FacebookError, toFacebookError } from '../services/facebook/errors';
import {
  listPages,
  publishPhoto,
  publishVideo,
  startVideoUpload,
  uploadVideoBytes,
  validatePhotoFile,
} from '../services/facebook/graph';
import type { FacebookPageCredential } from '../services/facebook/graph';
import { validateScheduleTime } from '../services/facebook/schedule';
import { fbInit, fbLogin, fbLogout, loadFbSdk } from '../services/facebook/sdk';
import type { FbSdk } from '../services/facebook/sdk';
import { detectMediaKind } from '../utils/mediaKind';

export type FacebookStatus = 'disabled' | 'disconnected' | 'connecting' | 'connected' | 'error';

/** 粉專顯示資訊(token 留在 ref,不進 render state)。 */
export interface FacebookPageInfo {
  pageId: string;
  pageName: string;
}

export interface PublishOutcome {
  kind: 'image' | 'video';
  photoId?: string;
  postId?: string | null;
  videoId?: string;
}

export interface PublishInput {
  file: File;
  caption: string;
  /** 排程(平台原生);null=立即。 */
  scheduledAtMs: number | null;
}

export function useFacebook() {
  const [status, setStatus] = useState<FacebookStatus>(FB_ENABLED ? 'disconnected' : 'disabled');
  const [error, setError] = useState<FacebookError | null>(null);
  const [pages, setPages] = useState<FacebookPageInfo[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const sdkRef = useRef<FbSdk | null>(null);
  const initedRef = useRef(false);
  const userTokenRef = useRef<{ accessToken: string; expiresAt: number } | null>(null);
  const pageTokensRef = useRef<Map<string, string>>(new Map());

  const clearConnection = useCallback(() => {
    userTokenRef.current = null;
    pageTokensRef.current = new Map();
    setPages([]);
    setSelectedPageId(null);
  }, []);

  const connect = useCallback(async () => {
    if (!FB_ENABLED) return;
    setConnecting(true);
    setError(null);
    setStatus('connecting');
    try {
      const sdk = await loadFbSdk();
      if (!initedRef.current) {
        fbInit(sdk);
        initedRef.current = true;
      }
      sdkRef.current = sdk;
      const auth = await fbLogin(sdk);
      userTokenRef.current = {
        accessToken: auth.accessToken,
        expiresAt: Date.now() + Math.max(auth.expiresIn - 60, 60) * 1000,
      };
      const list: FacebookPageCredential[] = await listPages({ userAccessToken: auth.accessToken });
      if (list.length === 0) throw new FacebookError('no_page', 'me/accounts returned no pages');
      pageTokensRef.current = new Map(list.map((p) => [p.pageId, p.accessToken]));
      setPages(list.map(({ pageId, pageName }) => ({ pageId, pageName })));
      setSelectedPageId(list[0]!.pageId);
      setStatus('connected');
    } catch (err) {
      const fe = toFacebookError(err);
      clearConnection();
      if (fe.code === 'cancelled') {
        setStatus('disconnected'); // 使用者關閉對話框:軟處理
        setError(null);
      } else {
        setError(fe);
        setStatus('error');
      }
    } finally {
      setConnecting(false);
    }
  }, [clearConnection]);

  const disconnect = useCallback(() => {
    if (sdkRef.current && userTokenRef.current) void fbLogout(sdkRef.current);
    sdkRef.current = null;
    clearConnection();
    setError(null);
    setStatus(FB_ENABLED ? 'disconnected' : 'disabled');
  }, [clearConnection]);

  /**
   * 發佈(圖片=photos multipart;影片=Resumable Upload API 三步)。
   * 失敗抛 FacebookError 並同步寫入 error state 供面板顯示;
   * token 過期時清連線、狀態回 error,提示重新連線。
   */
  const publish = useCallback(
    async (input: PublishInput): Promise<PublishOutcome> => {
      if (!FB_ENABLED || status !== 'connected') {
        throw new FacebookError('expired', '尚未連線或連線已失效');
      }
      const userToken = userTokenRef.current;
      const pageId = selectedPageId;
      const pageToken = pageId ? pageTokensRef.current.get(pageId) : undefined;
      if (!userToken || Date.now() >= userToken.expiresAt) {
        clearConnection();
        setStatus('error');
        const fe = new FacebookError('expired', 'user token 已過期,請重新連線');
        setError(fe);
        throw fe;
      }
      if (!pageId || !pageToken) {
        const fe = new FacebookError('no_page', '未選定粉專');
        setError(fe);
        throw fe;
      }

      const kind = detectMediaKind(input.file.type, input.file.name);
      if (kind !== 'image' && kind !== 'video') {
        const fe = new FacebookError('invalid_file', `無法發佈的媒體類型:${kind}`);
        setError(fe);
        throw fe;
      }
      if (kind === 'image') {
        const invalid = validatePhotoFile(input.file);
        if (invalid) {
          setError(invalid);
          throw invalid;
        }
      }
      if (input.scheduledAtMs != null) {
        const invalid = validateScheduleTime(kind, input.scheduledAtMs);
        if (invalid) {
          setError(invalid);
          throw invalid;
        }
      }

      setPublishing(true);
      setProgress(kind === 'video' ? 0 : null);
      setError(null);
      try {
        if (kind === 'image') {
          const r = await publishPhoto({
            pageId,
            pageToken,
            file: input.file,
            caption: input.caption,
            scheduledAtMs: input.scheduledAtMs ?? undefined,
          });
          return { kind, photoId: r.photoId, postId: r.postId };
        }
        const sessionId = await startVideoUpload({
          appId: FB_APP_ID,
          fileName: input.file.name,
          fileLength: input.file.size,
          fileType: input.file.type || 'application/octet-stream',
          userAccessToken: userToken.accessToken,
        });
        const fileHandle = await uploadVideoBytes({
          sessionId,
          userAccessToken: userToken.accessToken,
          file: input.file,
          onProgress: setProgress,
        });
        const r = await publishVideo({
          pageId,
          pageToken,
          fileHandle,
          description: input.caption,
          scheduledAtMs: input.scheduledAtMs ?? undefined,
        });
        return { kind, videoId: r.videoId };
      } catch (err) {
        const fe = toFacebookError(err);
        setError(fe);
        if (fe.code === 'expired' || fe.code === 'permission') {
          clearConnection();
          setStatus('error');
        }
        throw fe;
      } finally {
        setPublishing(false);
        setProgress(null);
      }
    },
    [clearConnection, selectedPageId, status],
  );

  return {
    status,
    error,
    pages,
    selectedPageId,
    connecting,
    publishing,
    /** 影片上傳進度 0~1;非上傳中為 null。 */
    progress,
    selectPage: setSelectedPageId,
    connect,
    disconnect,
    publish,
  };
}

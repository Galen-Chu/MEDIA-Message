/** FB 模組統一錯誤型別;UI 依 code 對應 zh-Hant 文案(見 constants.ts FB_ERROR_COPY)。 */

export type FacebookErrorCode =
  | 'disabled'
  | 'sdk_load_failed'
  | 'cancelled'
  | 'network'
  | 'expired'
  | 'permission'
  | 'no_page'
  | 'invalid_file'
  | 'schedule_window'
  | 'api'
  | 'parse'
  | 'unknown';

export class FacebookError extends Error {
  readonly code: FacebookErrorCode;

  constructor(code: FacebookErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'FacebookError';
    this.code = code;
  }
}

export function toFacebookError(err: unknown): FacebookError {
  if (err instanceof FacebookError) return err;
  if (err instanceof TypeError) return new FacebookError('network', String(err));
  if (err instanceof Error) return new FacebookError('unknown', err.message);
  return new FacebookError('unknown', String(err));
}

/**
 * Graph API 錯誤回應分類:body 形狀 {error:{message,type,code,error_subcode,fbtrace_id}}
 * (2026-10-05 查證 https://developers.facebook.com/docs/graph-api/guides/error-handling)。
 * code 190=token 失效/過期(需重新連線);200 系列=權限不足;其餘保留伺服器訊息。
 */
export function fromGraphResponse(status: number, bodyText: string): FacebookError {
  const brief = bodyText.slice(0, 300);
  let payload: { error?: { message?: string; type?: string; code?: number; error_subcode?: number } } = {};
  try {
    payload = JSON.parse(bodyText) as typeof payload;
  } catch {
    return new FacebookError('parse', `HTTP ${status} ${brief}`);
  }
  const err = payload.error;
  if (!err) return new FacebookError('api', `HTTP ${status} ${brief}`);
  const message = typeof err.message === 'string' ? err.message : brief;
  if (err.code === 190) return new FacebookError('expired', message);
  if (err.code === 200 || err.code === 136 || err.code === 10 || err.code === 2500) {
    return new FacebookError('permission', message);
  }
  return new FacebookError('api', message);
}

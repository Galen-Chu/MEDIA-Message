/**
 * FB JS SDK 載入與瀏覽器 OAuth(D7 定案):
 * - FB.login({ config_id }) 以商家版組態(Facebook Login for Business)帶出授權對話框;
 *   user-token 組態=implicit grant,直接回短效 user token(約 1~2 小時),全程不需 app secret
 * - token 僅由呼叫端(hook)存於記憶體;本模組不保存任何狀態
 * 文件(2026-10-05 查證):
 * https://developers.facebook.com/docs/facebook-login/facebook-login-for-business/web
 */
import { FB_APP_ID, FB_CONFIG_ID, FB_GRAPH_VERSION, FB_SDK_URL } from './config';
import { FacebookError } from './errors';

export interface FbAuthResponse {
  accessToken: string;
  userID: string;
  /** 秒;短效 user token 約 1~2 小時。 */
  expiresIn: number;
  signedRequest?: string;
  reauthorizeRequiredIn?: number;
}

interface FbLoginResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse: FbAuthResponse | null;
}

/** FB JS SDK 最小介面(本產品僅用 init/login/logout;不引入 @types 依賴)。 */
export interface FbSdk {
  init(opts: { appId: string; xfbml?: boolean; cookie?: boolean; version: string }): void;
  login(cb: (response: FbLoginResponse) => void, opts?: { config_id?: string }): void;
  logout(cb?: (response: unknown) => void): void;
}

declare global {
  interface Window {
    FB?: FbSdk;
    fbAsyncInit?: () => void;
  }
}

let sdkPromise: Promise<FbSdk> | null = null;

/** 載入 FB JS SDK(script 單例;SDK 已在頁面時直接回傳)。失敗抛 sdk_load_failed。 */
export function loadFbSdk(sdkUrl: string = FB_SDK_URL): Promise<FbSdk> {
  if (typeof window === 'undefined') {
    return Promise.reject(new FacebookError('sdk_load_failed', 'no window'));
  }
  if (window.FB) return Promise.resolve(window.FB);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<FbSdk>((resolve, reject) => {
    window.fbAsyncInit = () => {
      if (window.FB) resolve(window.FB);
      else reject(new FacebookError('sdk_load_failed', 'FB missing after init'));
    };
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.async = true;
    script.defer = true;
    script.src = sdkUrl;
    script.onerror = () => reject(new FacebookError('sdk_load_failed', `cannot load ${sdkUrl}`));
    document.head.appendChild(script);
  });
  sdkPromise.catch(() => {
    sdkPromise = null; // 允許之後重試
  });
  return sdkPromise;
}

/** FB.init(appId + 版本;cookie 關閉——token 一律只存記憶體,不落地)。 */
export function fbInit(sdk: FbSdk, appId: string = FB_APP_ID): void {
  sdk.init({ appId, xfbml: false, cookie: false, version: FB_GRAPH_VERSION });
}

/**
 * 登入:回短效 user token。使用者關閉對話框或未授權(status 非 connected)
 * 一律視為使用者取消(cancelled,軟處理不顯示錯誤)。
 */
export function fbLogin(sdk: FbSdk, configId: string = FB_CONFIG_ID): Promise<FbAuthResponse> {
  return new Promise<FbAuthResponse>((resolve, reject) => {
    sdk.login(
      (response) => {
        if (response.status === 'connected' && response.authResponse?.accessToken) {
          resolve(response.authResponse);
        } else {
          reject(new FacebookError('cancelled', `login status: ${response.status}`));
        }
      },
      { config_id: configId },
    );
  });
}

/** 登出(盡力而為;失敗不阻斷——token 反正只存記憶體,清除即失效於本產品)。 */
export function fbLogout(sdk: FbSdk): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      sdk.logout(() => resolve());
    } catch {
      resolve();
    }
  });
}

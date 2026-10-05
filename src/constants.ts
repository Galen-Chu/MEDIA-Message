import type { MediaKind } from './types';
import type { FacebookErrorCode } from './services/facebook/errors';
import type { FacebookStatus } from './hooks/useFacebook';

// UI 字串集中於此,不散落元件(家族慣例)

export const APP_TITLE = 'MEDIA-Message';
export const APP_NAME = '媒管庫';
export const APP_TAGLINE = '媒體為主,文字是說明——選擇本地圖片/影音檔,撰寫說明後直傳平台發佈';

export const FOOTER_NOTE = '排程一律使用平台原生機制;媒體絕不落地、絕不經過後端。';
export const FOOTER_PLAN_URL = 'https://github.com/Galen-Chu/MEDIA-Message/blob/main/M-PLAN.md';
export const FOOTER_PLAN_TEXT = '平台支援與分期規劃(M-PLAN)';

// ── 編輯器(附件為主、說明為輔)──
export const MEDIA_HEADING = '媒體附件';
export const MEDIA_PICK = '選擇檔案';
export const MEDIA_REMOVE = '移除';
export const MEDIA_RULES = [
  '圖片:JPEG/PNG/GIF/BMP/TIFF,≤4MB(平台限制)',
  '影片:建議 MP4;以分塊上傳,大小不限',
  '一次一則貼文、單一媒體檔,選新檔即取代',
  '檔案僅存瀏覽器記憶體,絕不落地',
];
export const MEDIA_KIND_LABEL: Record<MediaKind, string> = {
  image: '圖片',
  video: '影片',
  audio: '聲音',
  other: '其他',
};
export const AUDIO_KIND_HINT = '目前無平台可發佈純音檔(M-PLAN §2 查證),僅供預覽';

export const CAPTION_HEADING = '說明';
export const CAPTION_HINT = '附件為主、說明為輔——圖片說明或影片說明(選填)';
export const CAPTION_PLACEHOLDER = '這張照片/這支影片的說明…';

// ── 發佈面板 ──
export const PUBLISH_HEADING = '發佈——Facebook 粉專';
export const PUBLISH_CONNECT = '連接 Facebook';
export const PUBLISH_DISCONNECT = '中斷連線';
export const PUBLISH_PAGE_LABEL = '發佈粉專';
export const PUBLISH_MODE_LABEL = '發佈方式';
export const PUBLISH_MODE_NOW = '立即發佈';
export const PUBLISH_MODE_SCHEDULE = '排程(平台原生 scheduled_publish_time)';
export const PUBLISH_SCHEDULE_LABEL = '排程時間(至少 10 分鐘後;圖片 75 天內、影片 6 個月內)';
export const PUBLISH_BUTTON_NOW = '立即發佈';
export const PUBLISH_BUTTON_SCHEDULE = '排程發佈';
export const PUBLISH_UPLOADING = '上傳中…';
export const PUBLISH_DEMO_NOTE =
  '尚未設定 Facebook 連線參數(VITE_FB_APP_ID / VITE_FB_CONFIG_ID)——示範模式建置,發佈功能未啟用;設定後此處出現連線區';

export const FB_STATUS_LABEL: Record<FacebookStatus, string> = {
  disabled: '未啟用',
  disconnected: '未連線',
  connecting: '連線中…',
  connected: '已連線',
  error: '連線錯誤',
};

export const FB_ERROR_COPY: Record<FacebookErrorCode, string> = {
  disabled: 'Facebook 功能未啟用',
  sdk_load_failed: 'Facebook SDK 載入失敗,請檢查網路後重試',
  cancelled: '已取消連線',
  network: '網路錯誤,請重試',
  expired: '連線已過期或失效,請重新連線',
  permission: '權限不足——請確認後台組態已勾 pages_manage_posts 等三項權限',
  no_page: '找不到可發佈的粉專——請確認此帳號對粉專有建立內容權限',
  invalid_file: '檔案不符限制:圖片限 JPEG/PNG/GIF/BMP/TIFF 且 ≤4MB',
  schedule_window: '排程時間須在 10 分鐘後~75 天內(影片 6 個月內)',
  api: '平台回傳錯誤,請稍後重試',
  parse: '平台回應無法解析,請稍後重試',
  unknown: '發生未預期錯誤,請重試',
};

export const NOTICE_PUBLISHED = '已發佈!';
export const NOTICE_SCHEDULED = '已排程,平台將於指定時間自動發佈';

// ── 發佈歷史(僅 metadata 落地)──
export const HISTORY_HEADING = '發佈歷史';
export const HISTORY_HINT = '僅記錄檔名/類型/大小/說明等 metadata(本機 localStorage)';
export const HISTORY_EMPTY = '尚無發佈記錄';
export const HISTORY_CLEAR = '清除歷史';
export const HISTORY_CLEAR_CONFIRM = '確定清除所有發佈歷史?(僅清除本機 metadata 記錄,已發佈內容不受影響)';
export const HISTORY_STATUS_SCHEDULED = '排程中';
export const HISTORY_STATUS_PUBLISHED = '已發佈';

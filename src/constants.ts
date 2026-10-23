import type { MediaKind, TabKey } from './types';
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
/** 發佈成功但歷史寫入失敗(瀏覽器儲存空間已滿)時附在成功提示後。 */
export const NOTICE_HISTORY_NOT_SAVED =
  '——貼文本身已成功發佈;但瀏覽器儲存空間已滿,這筆紀錄未能保存,重新整理後不會出現在發佈歷史';

// ── 發佈歷史(僅 metadata 落地)──
export const HISTORY_HEADING = '發佈歷史';
export const HISTORY_HINT = '僅記錄檔名/類型/大小/說明等 metadata(本機 localStorage)';
export const HISTORY_EMPTY = '尚無發佈記錄';
export const HISTORY_CLEAR = '清除歷史';
export const HISTORY_CLEAR_CONFIRM = '確定清除所有發佈歷史?(僅清除本機 metadata 記錄,已發佈內容不受影響)';
export const HISTORY_STATUS_SCHEDULED = '排程中';
export const HISTORY_STATUS_PUBLISHED = '已發佈';

// ── 版面殼層(U1:側欄四頁籤,docs/IA-PLAN.md IA-D1/D2)──
export const SIDEBAR_IDENTITY_SUB = '社群媒體媒體發佈工具';
export const TAB_LABELS: Record<TabKey, string> = {
  dashboard: '媒管 Dashboard',
  media: '編發器 Media',
  history: '發佈史 History',
  library: '媒庫 Library',
};

// ── 媒管 Dashboard(統計由發佈歷史 metadata 即時計算)──
export const DASH_STATS_HEADING = '發佈統計';
export const DASH_STAT_PUBLISHED_MONTH = '本月已發佈';
export const DASH_STAT_PENDING = '待發排程';
export const DASH_STAT_IMAGES = '圖片數';
export const DASH_STAT_VIDEOS = '影片數';
export const DASH_CONNECT_HEADING = '連線狀態';
export const DASH_FB_CONNECTED = 'Facebook 已連線';
export const DASH_FB_NOT_CONNECTED = 'Facebook 未連線——到編發器連線後即可發佈';
export const DASH_START_BUTTON = '開始發佈';
export const DASH_UPCOMING_HEADING = '近期排程';
export const DASH_UPCOMING_EMPTY = '沒有待發的排程';

// ── 發佈史頁(篩選與排程狀態)──
export const HISTORY_FILTER_MODE_LABEL = '發佈方式';
export const HISTORY_FILTER_KIND_LABEL = '媒體類型';
export const HISTORY_FILTER_ALL = '全部';
export const HISTORY_FILTER_NOW = '立即';
export const HISTORY_FILTER_SCHEDULE = '排程';
export const HISTORY_FILTER_IMAGE = '圖片';
export const HISTORY_FILTER_VIDEO = '影片';
export const HISTORY_FILTER_EMPTY = '沒有符合篩選條件的記錄';
/** 排程記錄依排定時間與現在比較的狀態標籤。 */
export const HISTORY_STATE_PENDING = '待發';
export const HISTORY_STATE_DUE = '應已發佈';

// ── 媒庫頁(U1 首版=說明素材+家族切換卡,docs/IA-PLAN.md IA-D6)──
export const LIB_TEMPLATE_HEADING = '說明素材';
export const LIB_TEMPLATE_HINT =
  '儲存常用說明與標籤組(標籤組=只放標籤的範本),一鍵套用到編發器說明。純本機 localStorage;媒體檔絕不落地,媒庫只存文字素材。';
export const LIB_TEMPLATE_SAVE = '儲存目前說明';
export const LIB_TEMPLATE_SAVE_EMPTY_TITLE = '編發器的說明是空的——先到編發器撰寫,再回來儲存';
export const LIB_TEMPLATE_APPLY = '套用到編發器';
export const LIB_TEMPLATE_DELETE = '刪除';
export const LIB_TEMPLATE_DELETE_CONFIRM = '刪除這筆說明素材?';
export const LIB_TEMPLATE_EMPTY = '還沒有儲存的說明素材——在編發器寫好說明後,回這裡按「儲存目前說明」';
export const LIB_TEMPLATE_SAVED_NOTICE = '已儲存至說明素材';
/** 儲存時配額滿的誠實提示尾句(與發佈歷史同款)。 */
export const LIB_TEMPLATE_SAVE_FAILED = '——但瀏覽器儲存空間已滿,這筆素材未能保存';
export const LIB_TEMPLATE_APPLIED_NOTICE = '已套用到編發器說明,並切換至編發器';
export const LIB_FAMILY_HEADING = '家族';
export const LIB_FAMILY_HINT =
  '文管庫(TEXT-Message)負責文字工作流(郵件→草稿→發文),媒管庫負責媒體工作流。文管庫的文案可以「送至媒管庫」當說明——兩邊只交換文字,媒體檔、平台 token、郵件內容不流動。';
export const LIB_FAMILY_LINK = '前往文管庫 ↗';
/** 家族產品(文管庫)網址:側欄常駐切換與媒庫家族卡共用。 */
export const FAMILY_PEER_URL = 'https://galen-chu.github.io/TEXT-Message/';
/** U2 側欄常駐切換(IA-D7 ①;文管庫側欄對應「媒管庫 ↗」,兩邊文案格式一致)。 */
export const SIDEBAR_FAMILY_LINK = '文管庫 ↗';
export const SIDEBAR_FAMILY_TITLE = '前往文管庫(文字發文:郵件→草稿→發佈)';
export const LIB_FUTURE_NOTE =
  '媒體 metadata 區屬後續期次(docs/IA-PLAN.md U5)。';

// ── 媒庫收件匣(U3:文管庫「送至媒管庫」的文案;契約 family:handoff:v1,IA-PLAN §3.2)──
export const INBOX_HEADING = '來自文管庫';
export const INBOX_HINT = '文管庫按「送至媒管庫」的文案會出現在這裡;取用(套用/存為素材/捨棄)後即從收件匣移除,超過 7 天未取用自動失效。';
export const INBOX_EMPTY = '收件匣目前沒有來自文管庫的文案——在文管庫按「送至媒管庫」就會出現在這裡(超過 7 天未取用自動失效)。';
export const INBOX_APPLY = '套用到編發器';
export const INBOX_SAVE = '存為說明素材';
export const INBOX_DISMISS = '捨棄';
export const INBOX_DISMISS_CONFIRM = '捨棄這筆來自文管庫的文案?(文管庫端的原稿不受影響)';
export const INBOX_SENT_AT = (when: string) => `文管庫送出於 ${when}`;
export const INBOX_APPLIED_NOTICE = '已把文管庫的文案帶入編發器說明';
export const INBOX_SAVED_NOTICE = '已存為說明素材';
export const INBOX_DISMISSED_NOTICE = '已捨棄';
/** 取用後寫回佇列失敗(配額滿)的誠實提示尾句:該筆重新整理後會再出現。 */
export const INBOX_REMOVE_FAILED = '——但瀏覽器儲存空間已滿,未能從收件匣移除,重新整理後會再出現';
// ── 家族排程摘要(U4:讀文管庫 family:schedule-feed:text-message:v1;陳舊 7 天即隱藏)──
export const PEER_FEED_HEADING = '文管庫近期排程';
export const PEER_FEED_AS_OF = (when: string) => `資料截至 ${when}`;
export const PEER_FEED_EMPTY = '文管庫目前沒有待發的排程';
/** 對方從未發佈摘要、或摘要超過 7 天陳舊時顯示(整區不顯示排程內容)。 */
export const PEER_FEED_UNAVAILABLE = '還沒收到文管庫的排程摘要(開啟過文管庫後就會出現)';
/** 側欄媒庫頁籤的待取用數徽章(螢幕閱讀器用的完整說法)。 */
export const INBOX_BADGE_LABEL = (n: number) => `收件匣有 ${n} 筆來自文管庫的文案`;

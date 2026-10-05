import type { PlatformSupportRow } from './types';

// UI 字串集中於此,不散落元件(家族慣例)

export const APP_TITLE = 'MEDIA-Message';
export const APP_NAME = '媒管庫';
export const APP_TAGLINE = '媒體為主,文字是說明——選擇本地圖片/影音檔,撰寫說明後直傳平台發佈';

export const STATUS_HEADING = '產品狀態';
export const STATUS_M0_PILL = '已完成';
export const STATUS_M0 = 'M0 骨架:repo、scaffold 與 CI(2026-10-05)';
export const STATUS_M1_PILL = '開發中';
export const STATUS_M1 = 'M1 FB 粉專媒體發佈:待 D7 決策後開工';

export const PLATFORM_HEADING = '平台支援(規劃)';
export const PLATFORM_NOTE =
  '平台能力查證見 M-PLAN.md §2;排程一律使用平台原生機制,媒體絕不落地、絕不經後端';
export const PLATFORM_SUPPORT: PlatformSupportRow[] = [
  { platform: 'Facebook 粉專', capability: '圖片/影片直傳', schedule: '原生排程', phase: 'M1' },
  { platform: 'YouTube', capability: '影片直傳', schedule: '原生排程(publishAt)', phase: 'M2' },
  { platform: 'Threads / Instagram', capability: '平台 API 限公開網址', schedule: '待查證', phase: 'M3' },
];

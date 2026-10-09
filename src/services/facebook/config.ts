/**
 * 建置期環境設定(FB 粉專媒體發佈模組)——唯讀 env;未設定=降級建置
 * (UI 不出現連線區),建置不得失敗(文管庫同規)。
 * 兩值皆非機密:app id 是公開識別碼、config_id 只在瀏覽器使用(D7 定案,
 * 全程不需 app secret);值來源與後台設定手冊見文管庫 docs/BACKEND.md §7.2。
 */
export const FB_APP_ID: string = (import.meta.env.VITE_FB_APP_ID ?? '').trim();

/** 商家版組態 id(Facebook Login for Business):dialog 以 config_id 帶出組態,權限勾在組態上。 */
export const FB_CONFIG_ID: string = (import.meta.env.VITE_FB_CONFIG_ID ?? '').trim();

/** 未設齊兩值時為 false:編輯器不出現發佈連線區(純示範模式建置)。 */
export const FB_ENABLED: boolean = FB_APP_ID.length > 0 && FB_CONFIG_ID.length > 0;

/**
 * Graph API 版本:2026-10-05 查證 changelog,v26.0=當下最新
 * (文管庫 worker 固定 v25.0,仍有效至 2028-07-29;兩邊各自固定、互不影響)。
 * https://developers.facebook.com/docs/graph-api/changelog
 */
export const FB_GRAPH_VERSION = 'v26.0';

/**
 * Graph API 主機(粉專清單 /me/accounts、圖片 photos、影片上傳三步全部走此處)。
 * 2026-10-09 查證:graph-video.facebook.com 影片上傳主機已停用,一律改用 graph.facebook.com
 * (Video API 入門頁明載;發佈指南示例仍殘留舊主機,以停用公告為準)。
 * https://developers.facebook.com/docs/video-api/getting-started
 */
export const FB_GRAPH_BASE = `https://graph.facebook.com/${FB_GRAPH_VERSION}`;

/**
 * FB JS SDK(瀏覽器 OAuth:FB.login 以 config_id 帶出商家版組態,回短效 user token)。
 * https://developers.facebook.com/docs/facebook-login/facebook-login-for-business/web
 */
export const FB_SDK_URL = 'https://connect.facebook.net/zh_TW/sdk.js';

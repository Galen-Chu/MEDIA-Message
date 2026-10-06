# 媒體串接設定與驗收測試手冊(SETUP)

> 給誰看:**維護者**(後台與 secret 設定)、**驗收測試者**(真機驗收)、**自架者**(Fork/自架)。每個新平台上線時在本手冊加一節(§N 連續)。

## 0. 這份文件給誰看

| 你是誰 | 看哪節 |
| --- | --- |
| 維護者(首次啟用正式站) | §1–§4、§7 |
| 驗收測試者(驗收新功能) | §5(及對應平台節) |
| 自架者(Fork 本專案) | §6 |

## 1. 運作原理(1 分鐘版)

**零後端**。FB JS SDK `FB.login({ config_id })` 在瀏覽器完成授權 → 回短效 user token(**僅存記憶體**,約 1–2 小時)→ 瀏覽器以 user token 呼叫 `/me/accounts` 取 page token → 瀏覽器**直傳** Graph API(圖片 multipart、影片 Resumable 三步)。排程一律走平台原生 `scheduled_publish_time`(上傳當下帶參數,**不必保存 token**)。

- 媒體檔**絕不落地、絕不經後端**——只存在瀏覽器記憶體;
- localStorage 僅存發佈歷史 metadata(檔名/類型/大小/說明/時間,key `media-message:v1`);
- 不需要 app secret,任何環境都不該出現它。

## 2. Meta 後台設定(維護者;一次性)

沿用**文管庫同一個 Meta App 與商家版組態**(完整脈絡=文管庫 `docs/BACKEND.md` §7.2),媒管庫不需要另建:

1. **App ID**:developers.facebook.com → 該 App → App settings → Basic →「App ID」(純數字);
2. **組態 ID**:產品「商家專用 Facebook 登入」→ 組態 → 勾了 `pages_show_list`/`pages_read_engagement`/`pages_manage_posts` 三項權限那個組態的「組態 ID」;
3. **加入網域**:App settings → App domains 加入 `localhost`(開發)與 `galen-chu.github.io`(正式)。

## 3. 本機開發

```bash
cp .env.example .env.local   # 填 VITE_FB_APP_ID / VITE_FB_CONFIG_ID(值=§2,皆非機密)
npm install
npm run dev
```

## 4. 正式部署設定(維護者)

1. **啟用 Pages**(一次性):repo Settings → Pages → Source 選「**GitHub Actions**」;
2. **設定 secrets**(Repository secrets,名稱精確):`FB_APP_ID`、`FB_CONFIG_ID`——值=§2 的兩個 ID。位置:Settings → Secrets and variables → **Actions** 分頁 →「Repository secrets」區(不是 Environment/Dependabot/Codespaces);
3. push `main` 自動部署(`.github/workflows/deploy.yml`):單元測試 → 建置 → E2E(部署閘門)→ Pages。缺任一 secret = **示範模式建置**(不出現連線鈕),建置不會失敗。

**驗證注入**:部署後抓正式站 bundle(HTML 內 `assets/*.js`)grep 兩個 ID——注入步驟顯示 success ≠ 有寫入檔案(缺 secret 時靜默跳過也是 success),詳見 [`INCIDENTS.md`](INCIDENTS.md)。瀏覽器端驗收前先 **Ctrl+F5** 清 CDN 快取。

## 5. 驗收測試者操作流程(M1:FB 粉專媒體發佈;清單制定 2026-10-06,待驗收)

1. **連線授權**:按「連接 Facebook」→ 登入 → 授權頁應**列出三個 pages 權限** → 同意 → 顯示已連線與粉專名稱;
2. **圖片立即發佈**:選 ≤4MB 的 jpeg/png → 填說明 → 立即發佈 → 粉專出現貼文(圖+說明)→ 發佈歷史新增一筆;
3. **排程**:選圖片 → 排程 → 選 10 分鐘後~75 天內 → 發佈 → 粉專後台「排定的貼文」出現;歷史記錄標記排程;
4. **影片**:選短 .mp4 → 立即發佈 → 進度條跑完三階段(起始→上傳中→發佈)→ 粉專出現影片。**首次實測關注**:非 mp4 檔(.mov/.webm)是否被拒(錯誤訊息會顯示原因)、瀏覽器直傳 graph-video 的 CORS;
5. **邊界行為**:>4MB 圖片 → 明確錯誤不上傳;排程選過去時間 → 被擋;**重整頁面回到未連線是預期行為**(token 僅記憶體,非 bug);
6. 全數通過後:本節標 ✅+日期,M-PLAN M1 收尾歸檔。

## 6. 自架 / Fork 路徑

Fork → 啟用自己 repo 的 Pages(§4.1)→ 建立自己的 Meta App 與商家版組態(步驟同 §2,但用你自己的 App)→ 設自己 repo 的兩個 secrets → push。注意:未過 App Review 的 App 僅能授權「App 角色名單」內的帳號(自用足夠);對外開放需 App Review。

## 7. 隱私說明

本專案**沒有後端**。媒體檔僅存在瀏覽器記憶體,上傳時由瀏覽器**直接**送往該平台(FB);access token 僅存記憶體,關頁或中斷連線即消失。發佈歷史(metadata)存於各自瀏覽器的 localStorage,清除瀏覽器資料即重置。後續 AI 功能(規劃中)採 BYOK——媒體與指令由瀏覽器直接送往使用者自己金鑰的 AI 服務,同樣不經本專案任何伺服器。

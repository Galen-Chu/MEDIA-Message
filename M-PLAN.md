# MEDIA-Message(媒管庫)產品規劃

2026-09-23 產品討論定案、2026-09-29 repo 建立(M-PLAN v1)。與 [TEXT-Message(文管庫)](https://github.com/Galen-Chu/TEXT-Message) 為**家族產品**:文管庫文字為主,本產品**媒體為主、文字是說明**——編輯器的第一公民是媒體檔,caption 是附件欄,整個 IA 與文管庫鏡像對調。

## 1. 背景與定位

維護者於文管庫的發佈串接(Threads)與排程上見到效益後,規劃發佈**聲音/圖片/影像檔**至社群媒體。經評估採**獨立產品**而非併入文管庫,理由:

- 內容工作流定位為「媒體為主、文字是說明」——工作流主軸與文管庫(郵件→文字草稿→AI 改寫)相反,同專案會讓 IA 與資料模型兩頭拉扯;
- 分家的分水嶺明確:**需要自建圖床/媒體資產庫的那一刻**(見 §2 查證)——在此之前文管庫的媒體功能(YouTube 上傳)不遷移、不重複維運;
- 家族命名對仗:TEXT-Message(文管庫)↔ **MEDIA-Message(媒管庫)**;聲音線另議(見 §5 遠期)。

## 2. 平台能力查證(2026-09-23;動手前仍須依串接紀律複查當下文件)

| 平台 | 圖片 | 影片 | 純音檔 |
| --- | --- | --- | --- |
| FB 粉專 | **可直傳二進位**(`/{page-id}/photos` 的 `source` multipart) | 可直傳(resumable) | 不支援 |
| YouTube | — | 文管庫已上線(瀏覽器直傳 resumable,模組可複製) | 不支援 |
| Threads | **只吃公開 hosted URL**(container `image_url`,Meta 自行抓取;JPEG/PNG ≤8MB) | 只吃 hosted URL(`video_url`) | 不支援 |
| Instagram | 只吃 hosted URL(container 模式;另需商業帳號+綁粉專) | hosted URL | 不支援 |

來源:[Meta Graph API — Page Photos](https://developers.facebook.com/docs/graph-api/reference/page/photos/)、[Meta — Instagram Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing)、[Threads API 媒體規格整理(PostProxy)](https://postproxy.dev)、[Ayrshare — Threads media hosting](https://www.ayrshare.com)。

**含義**:

1. FB 是唯一「本地檔案直接上傳」全程通的平台 → MVP 首發;**FB 粉專建立為共用前置**(文管庫的 FB 文字串接亦用它,2026-09-29 維護者確認兩邊都會做)。
2. Threads/IG 需公開網址。已知 workaround:先以 `published=false` 上傳至自家 FB 粉專拿 hosted URL,再餵 container——**URL 穩定性屬 M3 動手前必查證項**;若需自建圖床(Cloudflare R2 或 worker 服務檔案),即觸發新一期決策(新基礎設施+隱私邊界)。
3. 無主流社群平台接受純音檔 → 聲音內容的真實形態是 podcast hosting(Firstory/SoundOn 等,API 可用性待查)或「音+封面→影片」;故順位最後、屆時再議產品名(VOICE-Message / AUDIO-Message)。

## 3. 核心迴圈與紅線

**迴圈**:本地媒體檔 → 寫說明(caption)→ 選平台 → 立即發佈或排程 → 發佈歷史。

**紅線(整套沿用文管庫體系)**:

- **媒體檔僅存瀏覽器記憶體,絕不落地、絕不過後端**;落地僅 metadata(檔名/類型/大小/平台/說明);
- **排程一律走平台原生**——「立即上傳 + 平台排定時間」(YouTube `publishAt` 已在文管庫驗證;FB 有 `scheduled_publish_time`)。worker 佇列不得承載媒體;
- worker 職責僅限:平台 OAuth 代管(token 加密保存、可隨時 revoke)、API 代呼叫。emails 與 AI key 概念不適用本產品,但任何使用者資料比照「後端只收必要」原則;
- caption 的 AI 能力整套複製文管庫 Gemini BYOK 模組(語氣/角色/語言/平台版本生成),key 僅存使用者瀏覽器。

## 4. 決策記錄(D1–D6,2026-09-23 討論、2026-09-29 隨 repo 建立暫行定案;任一項動工前維護者可推翻,改動即更新本節)

- **D1 MVP 平台順序**:FB 粉專 → YouTube → Threads/IG(依 §2 工程現實排序,非偏好排序)
- **D2 YouTube 去向**:以**複製**(非遷移)帶入本 repo;文管庫現有 YouTube 上傳不動,兩邊穩定後再議文管庫側除役與否
- **D3 一期媒體來源**:本地檔案(僅記憶體+metadata 落地);圖床自建屬後期(與 M3 綁定)
- **D4 排程模式**:平台原生排程為唯一路徑;worker 不碰媒體
- **D5 與 TEXT-Message 整合**:深連結雙向導(排程/說明預填);Meta OAuth app 共用與否屆時拍板(token 建議**各自 worker** 保管,避免部署互綁);發文歷史以**匯出/匯入 JSON** 聚合,不共用 KV(維持各自資料邊界)
- **D6 技術骨架**:同 stack 同慣例——React+TypeScript(strict)+Vite、Cloudflare Workers+KV、vitest(純邏輯必測、**完整請求形狀斷言**)、E2E smoke 等級、UI 字串集中 constants.ts;共用元件用**複製**、不 monorepo(文管庫技術債 sprint 後再議)

## 5. 分期

- **M0(本期)**:repo 與文件(M-PLAN/CLAUDE.md/README);等 FB 粉專建立期間可先行 scaffold
- **M1:FB 粉專媒體發佈**——圖片直傳(`source` multipart)、影片直傳(resumable)、`scheduled_publish_time` 原生排程、發佈歷史;編輯器「附件為主、說明為輔」IA 首版
- **M2:YouTube**——複製文管庫 `services/youtube` 模組(gis/uploadApi/video),配合本產品 IA 調整
- **M3:Threads/IG**——前置查證:unpublished-photo hosted URL 的穩定性;可行則以組合流程實作(直傳 FB 拿 URL→餵 container),不可行則圖床決策(觸發 D3 後段/新期)
- **遠期:聲音線**——先定義內容形態(podcast 節目 vs 短語音),再決定 VOICE-Message / AUDIO-Message 獨立與否;依賴本產品的影片/圖床能力當載體

## 6. 與 TEXT-Message 的邊界備忘

- FB **文字**發佈留在文管庫(`threads/` 模組鏡像),本產品不做純文字發佈;兩邊各自保管 token、路線圖互不綁架(2026-09-29 維護者確認);
- 文管庫既有功能(YouTube 上傳、Threads 發佈)不因本產品改動;
- 本產品開工與文管庫進行中事項(文庫雲端備份方案 A 等)互不阻塞。

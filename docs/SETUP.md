# 媒體串接設定與驗收測試手冊(SETUP)

> 給誰看:**維護者**(後台與 secret 設定)、**驗收測試者**(真機驗收)、**自架者**(Fork/自架)。每個新平台上線時在本手冊加一節(§N 連續)。

## 0. 這份文件給誰看

| 你是誰 | 看哪節 |
| --- | --- |
| 維護者(首次啟用正式站) | §1–§4、§7 |
| 驗收測試者(驗收新功能) | §5(及對應平台節) |
| 自架者(Fork 本專案) | §6 |

## 1. 運作原理(1 分鐘版)

**零後端**。FB JS SDK `FB.login({ config_id })` 在瀏覽器完成授權 → 回短效 user token(**僅存記憶體**,約 1–2 小時)→ 瀏覽器以 user token 呼叫 `/me/accounts` 取 page token → 瀏覽器**直傳** Graph API(圖片/影片皆 multipart 單請求直傳)。排程一律走平台原生 `scheduled_publish_time`(上傳當下帶參數,**不必保存 token**)。

- 媒體檔**絕不落地、絕不經後端**——只存在瀏覽器記憶體;
- localStorage 僅存發佈歷史 metadata(檔名/類型/大小/說明/時間,key `media-message:v1`);
- 不需要 app secret,任何環境都不該出現它。

## 2. Meta 後台設定(維護者;一次性)

與文管庫**共用同一個 Meta App**(完整脈絡=文管庫 `docs/BACKEND.md` §7.2),但**組態各自獨立**:文管庫 worker 走授權碼流程,續用舊組態 `4553990238180987`(System-user 權杖類型,**勿改勿刪**);本產品瀏覽器端 OAuth 須**另建「User access token(使用者存取權杖)」型組態**——權杖類型不符會在授權彈窗直接被拒(實錄見 §8 #2;2026-10-08 定案):

1. **App ID**:developers.facebook.com → 該 App → App settings → Basic →「App ID」(純數字);
2. **自建組態**:產品「商家專用 Facebook 登入」→ 組態 → 建立組態,**權杖類型選「User access token」**,權限勾**四項**:`pages_show_list`、`pages_read_engagement`、`pages_manage_posts`、`business_management`——**第四項不可省**:粉專連結商業組合後,token 缺 `business_management` 時 `/me/accounts` 會回空清單(§8 #3);若組態權限選單找不到該項,先到「App 檢閱 → 權限與功能」開啟(App 管理員在開發模式免 App Review 即可自用)。建好記下「組態 ID」(目前正式站=`1091823893707303`);
3. **加入網域**:App settings → App domains 加入 `localhost`(開發)與 `galen-chu.github.io`(正式);
4. **開啟「透過 JavaScript SDK 登入」**(2026-10-07 驗收首測踩到):產品「商家專用 Facebook 登入」→「設定」分頁 →「**透過 JavaScript SDK 登入**」切為「**開啟/是**」,並確認同頁「允許的網域」含 `galen-chu.github.io`(與開發用 `localhost`)。未開啟時,連線彈窗會停在 Facebook 錯誤頁「**JSSDK 選項未切換至開啟**」。文管庫同一 App 走**轉址式 OAuth 不需此開關**,因此此前從未開過——此為後台設定,非程式問題。

組態內**權限的增減即時生效**——改完在 App「中斷連線」後重新授權即可,不需重新部署;但**更換組態**(含新建)須更新 repo secret `FB_CONFIG_ID` 並重跑部署(Actions 頁可手動重跑,免推 commit,見 §4)。

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

## 5. 驗收測試者操作流程(M1:FB 粉專媒體發佈;清單制定 2026-10-06;第 1、2、4 項 ✅ 2026-10-08/10-20,第 3、5 項待測)

> **2026-10-20 起版面=側欄四頁籤(U1)**:發佈相關操作都在「🎬 編發器 Media」頁籤(側欄切入,或媒管 Dashboard 的「開始發佈」鈕;`#media` 深連結亦可直達);發佈歷史在「📅 發佈史 History」頁籤(新增發佈方式×媒體類型篩選;排程記錄顯示「待發/應已發佈」)。第 1、2、4 項於舊版面通過,操作路徑等價,結論沿用;第 3、5 項依下列步驟在**新版面**下驗收。

1. **連線授權**(✅ 2026-10-08):按「連接 Facebook」→ 登入 → 授權頁應**列出四項權限**(三個 pages 權限+`business_management`)→ 同意 → 顯示已連線與粉專名稱;
2. **圖片立即發佈**(✅ 2026-10-08):選 ≤4MB 的 jpeg/png → 填說明 → 立即發佈 → 粉專出現貼文(圖+說明)→ 發佈歷史新增一筆;
3. **排程**(新版面):側欄切到「編發器 Media」→ 選圖片 → 排程 → 選 10 分鐘後~75 天內 → 發佈 → 粉專後台「排定的貼文」出現;發佈史頁籤該筆顯示「待發」(到點後重新整理會變「應已發佈」);
4. **影片**(✅ 2026-10-20 立即發佈通過;2026-10-19 上傳路徑改版後部署複測):選短 .mp4 → 立即發佈 → 進度條跑完 → 粉專出現影片。**改版緣由**:首測採的 Resumable 三步在二進位傳輸端點(`/upload:{session}`)被瀏覽器 CORS 預檢擋下(該端點不回 `Access-Control-Allow-Origin`,Meta 開發者社群同案;實錄見 §8 補記)→ 改為 `POST /{page-id}/videos` 的 `source` 單請求 multipart(與圖片同構,v26.0 文件明載)。**複測前 Ctrl+F5**;另觀察非 mp4 檔(.mov/.webm)是否被伺服器拒(錯誤訊息會顯示原因;屬選測觀察項,2026-10-20 以 .mp4 通過即驗收);
5. **邊界行為**(新版面):>4MB 圖片 → 明確錯誤不上傳;排程選過去時間 → 被擋;切換其他頁籤再切回編發器,選好的檔案與說明仍在(編輯狀態留 App 層,切頁籤不清空);**重整頁面回到未連線是預期行為**(token 僅記憶體,非 bug);
6. 全數通過後:本節標 ✅+日期,M-PLAN M1 收尾歸檔。

### 5.1 家族串接 U3:文管庫 → 媒管庫說明交接(2026-10-22 制定;需在正式站驗,兩站同源才共用 localStorage;✅ 2026-10-22 正式站驗收通過)

1. 文管庫編發器寫一段文案 → 按「送至媒管庫」→ 提示「已送至媒管庫(收件匣待取用 1 筆)」;
2. 媒管庫(已開著的分頁免重新整理):側欄「媒庫 Library」右上出現數字徽章 → 進媒庫,頂端「來自文管庫(1)」列出該文案;
   也可從文管庫家族卡開啟(`#handoff` 深連結直接落媒庫);
3. 按「套用到編發器」→ 切到編發器、說明欄帶入文案、徽章消失;回文管庫,「已送出、媒管庫尚未取用」計數歸零;
4. 再送一筆 → 媒庫按「存為說明素材」→ 出現在說明素材清單、移出收件匣;再送一筆 → 「捨棄」→ 確認後移除;
5. 邊界:超過 7 天未取用的交接自動失效(不需實測,單元測試涵蓋)。

### 5.2 家族串接 U4:互看近期排程(2026-10-22 制定;正式站驗;✅ 2026-10-22 正式站驗收通過)

1. 媒管庫排程發佈一則(§5 第 3 項可順便)→ 開文管庫文庫 Library 家族卡:「媒管庫近期排程」出現該則(平台顯示 Facebook、時間=排定時間、片段=說明前 60 字),並標「資料截至 …」;
2. 文管庫定排程新增一則未來排程 → 開媒管庫媒庫:家族卡「文管庫近期排程」出現該則(兩站分頁都開著時免重新整理);
3. 邊界:對方摘要超過 7 天未更新=整區改顯示「還沒收到…的排程摘要」(不需實測,單元測試涵蓋)。

> **2026-10-22 驗收紀錄**:以 headless 瀏覽器(獨立乾淨設定檔,不碰使用者資料)實操兩個正式站,§5.1 第 1–3 項與 #handoff 深連結、§5.2 第 1 項(媒管庫側以注入一筆未到點排程歷史代替真實 FB 排程——真實 FB 排程屬 §5 第 3 項)與反向讀取(文管庫全新設定檔預載的示範排程 LINE/Facebook 正確顯示於媒管庫)共 10 項全過。§5.1 第 4 項(存為素材/捨棄)由 E2E 與單元測試涵蓋。

## 6. 自架 / Fork 路徑

Fork → 啟用自己 repo 的 Pages(§4.1)→ 建立自己的 Meta App 與商家版組態(步驟同 §2,但用你自己的 App)→ 設自己 repo 的兩個 secrets → push。注意:未過 App Review 的 App 僅能授權「App 角色名單」內的帳號(自用足夠);對外開放需 App Review。

## 7. 隱私說明

本專案**沒有後端**。媒體檔僅存在瀏覽器記憶體,上傳時由瀏覽器**直接**送往該平台(FB);access token 僅存記憶體,關頁或中斷連線即消失。發佈歷史(metadata)存於各自瀏覽器的 localStorage,清除瀏覽器資料即重置。後續 AI 功能(規劃中)採 BYOK——媒體與指令由瀏覽器直接送往使用者自己金鑰的 AI 服務,同樣不經本專案任何伺服器。

## 8. 串接實錄:瀏覽器端 FB 串接障礙(2026-10-07~19 真機驗收)

M1 驗收連線階段連踩三個**後台組態層**障礙(程式碼零改動,照 §2 正確設定可全數避開);影片首測另遇一個**程式路徑層**障礙(CORS,已改版修復,見表後補記)。此處留檔根因與修法供排查複用。

| # | 現象(App 端) | 根因 | 修法 |
| --- | --- | --- | --- |
| 1 | 彈窗停在 FB 錯誤頁「JSSDK 選項未切換至開啟」 | App 從未開「透過 JavaScript SDK 登入」(文管庫走轉址式 OAuth 不需此開關,故從未開過) | 後台開啟(§2 第 4 步);即時生效 |
| 2 | 彈窗錯誤「response_type 必須為有效的列舉。此流程不支援 response_type=token」 | 組態**權杖類型**=System-user access token(僅授權碼流程,當初為文管庫 worker 所建);瀏覽器 `FB.login` 隱式流程請求 token 即被拒 | **另建「User access token」型組態**(隱式流程為其預設)→ 更新 secret `FB_CONFIG_ID` → Actions 重跑部署(§2 第 2 步) |
| 3 | 授權完成、token 有效,App 報「找不到可發佈的粉專」;DevTools 看 `/me/accounts` 回空 `data` 陣列 | 粉專**連結商業組合**後,user token 缺 `business_management` 時 Graph 不回傳該粉專——授權頁三項 pages 權限齊全也一樣(Graph v17/v18 起行為,開發者社群多起同案) | 組態補勾 `business_management` → App「中斷連線」→ 重新連線(§2 第 2 步);即時生效 |

**排查方法(可複用)**:錯誤文案先對照 `src/constants.ts` `FB_ERROR_COPY` 分類——`no_page` 僅在 API 成功回空清單時出現,可直接排除拒絕/網路;再以 DevTools(F12 → 網路 → 篩選 `accounts`)看實際回應,直接分辨「清單真空=設定/授權層」vs「有資料=程式解析層」;正式站設定疑慮以 bundle 探測實證(§4 驗證注入同法)。

**補記:影片上傳「網路錯誤」=CORS(2026-10-19,程式路徑層)**:影片首測報「網路錯誤,請重試」,DevTools Console 實證 `POST /upload:{session}`(Resumable 二步)被 CORS 預檢擋下——此步依官方文件帶 `Authorization: OAuth`+`file_offset` 自訂標頭必觸發預檢,而該端點不回 `Access-Control-Allow-Origin`(Meta 開發者社群同案,瀏覽器端無解;第一步 `uploads` 正常完成,故非後台設定問題)。修法=上傳路徑改版:`/{page-id}/videos` 的 `source` 單請求 multipart(v26.0 文件明載必填,與已驗證的圖片 photos 路徑同構、同主機)。

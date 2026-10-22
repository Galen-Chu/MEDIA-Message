# CLAUDE.md

MEDIA-Message(媒管庫;repo Galen-Chu/MEDIA-Message)— 社群媒體**媒體發佈**工具:媒體為主、文字是說明。與 TEXT-Message(文管庫)為家族產品,技術骨架與慣例整套沿用文管庫(見下);**目前狀態:M0+M1 已上線——正式站啟用模式部署成功(2026-10-06,bundle 注入驗證);M1 真機驗收進行中(2026-10-08 連線授權+圖片發佈、2026-10-20 影片發佈先後通過,排程/邊界待測,實錄=`docs/SETUP.md` §8);U1 版面殼層(側欄四頁籤)2026-10-20 開發完成(三關全綠,隨下批 push 上線)**,產品決策 D1–D7 定案見 `docs/M-PLAN.md` §4。

## 常用指令

```bash
npm run dev        # 開發伺服器
npm run build      # 型別檢查 + vite build(+ worker 型別檢查)
npm test           # 單元測試(vitest)
npm run test:e2e   # Playwright E2E(serve dist;跑之前先 npm run build)
```

## 架構(M1;後續期次擴充)

- 前端:React 19 + TypeScript 7(strict)+ Vite 8 + Vitest 5(2026-10-20 工具鏈對齊文管庫 proven 配方,零程式改動;`vite.config.ts` 的 `test.pool:'threads'` 是 Vitest 5 forks 在 Windows 隨機丟檔的修正,勿改回);編輯器第一公民=媒體檔(本地檔案僅記憶體,落地僅 metadata)
- `src/App.tsx` — U1 版面殼層:側欄四頁籤(媒管 Dashboard/編發器 Media/發佈史 History/媒庫 Library,`docs/IA-PLAN.md` IA-D2),activeTab 由 hash 初始化+聆聽 hashchange(切頁 `replaceState` 不塞返回歷史);編輯器狀態(file/previewUrl/caption/mode)留 App 層——切頁籤不遺失、上傳中切頁不中斷(IA-PLAN §3.3),狀態量小不加全域 store
- `src/services/facebook/` — M1 FB 粉專模組(**D7:瀏覽器端 OAuth、零後端、零 app secret**):`config`(env+Graph v26.0)/`sdk`(FB JS SDK 載入、`FB.login({config_id})` 回短效 user token)/`graph`(`/me/accounts` 錨定抽取 page id、photos multipart 直傳、影片 videos `source` multipart 單請求;fetch 可注入)/`schedule`(排程時間窗純邏輯)/`errors`(Graph code 分類)
- `src/hooks/useFacebook.ts` — 連線狀態機(`disabled|disconnected|connecting|connected|error`;token 僅記憶體、過期導向重連);`publish` 統一入口(檔案驗證+排程驗證+分派圖/影片路徑+影片進度)
- `src/services/history.ts` — 發佈歷史:僅 metadata 落地(localStorage `media-message:v1`,上限 200 筆,storage 可注入)
- `src/services/library.ts` — 媒庫說明素材:純文字範本(localStorage `media-message:library:v1`,上限 50 筆;鏡像 history.ts 模式——storage 可注入、防禦式解析、配額滿 `saveFailed` 永不拋)
- `src/components/` — 殼層與四頁:`Sidebar`(四頁籤側欄,結構複製文管庫)/`Dashboard`(統計卡+連線摘要+近期排程)/`History`(發佈史頁=篩選 chips+記錄列表)/`Library`(媒庫頁=說明素材+家族切換卡);編發器:`MediaPicker`(附件選檔+預覽)/`PublishPanel`(連線+粉專選擇+立即/排程+進度)/`HistoryCard`(記錄列表;排程記錄依現在時間顯示「待發/應已發佈」)
- `src/utils/mediaKind.ts` — 媒體類型偵測(MIME 前綴,缺漏時副檔名 fallback);`src/utils/format.ts` — 大小/時間顯示格式化;`src/utils/dashboard.ts` — Dashboard 統計/近期排程純函式;`src/utils/historyFilters.ts` — 發佈史篩選+排程狀態判定
- `src/index.css` — 設計系統自文管庫整套複製(深色模式、WCAG AA 已驗證 token;調整 palette 時重跑 `scripts/contrast-audit.mjs`)
- `vite.config.ts` 的 `base: '/MEDIA-Message/'` 為 Pages 子路徑所需,勿移除
- 後端輔助:M1 起**不需要**——FB 全程瀏覽器直傳;未來期次(Threads/IG 需 hosted URL)再評估
- caption AI:Gemini BYOK 模組複製自文管庫(語氣/角色/語言)屬後續期次,key 僅存使用者瀏覽器

## FB 串接設定(D7:瀏覽器端 OAuth)

- 完整手冊(維護者/驗收測試者/自架者):`docs/SETUP.md`——後台來源、本機 `.env.local`、正式 secrets 與 bundle 探測驗證、驗收清單皆在該檔;新平台串接上線時於該檔加節
- 摘要:GitHub secrets `FB_APP_ID`/`FB_CONFIG_ID` → `deploy.yml` 選用注入 `.env.production`(缺 secret=示範模式建置,不得失敗);後台唯一動作=Meta App 加入本站網域

## CI/CD

- PR:`.github/workflows/ci.yml`(vitest → build → Playwright)
- main push:`deploy.yml`(test → build → E2E → Pages 部署;**E2E 是部署閘門**,示範與啟用兩種建置皆須通過——E2E 斷言採模式分歧擇一)
- secret 注入=選用式(`env:` + shell `if`,`secrets` context 不可用於 step `if:`);CI 事故與教訓見 `docs/INCIDENTS.md`

## 紅線(修改時勿破壞)

- **媒體檔絕不落地、絕不經後端**——僅存瀏覽器記憶體,localStorage 只存 metadata 與使用者內容
- token 僅記憶體者(瀏覽器直傳平台)中斷連線即 revoke;worker 代管者加密保存、可隨時 revoke
- 未設定對應 Client ID / 後端端點的建置=降級模式,**建置不得失敗**(文管庫同規)
- **跨產品(與文管庫同源 galen-chu.github.io)**:僅 Gemini 金鑰可共用——唯讀文管庫 `text-message:gemini-key`、永不寫入/清除對方鍵;OAuth token 與郵件內容**不流動**;其餘串接只走版本化 `family:*` 契約鍵、不互讀對方內部鍵(`docs/IA-PLAN.md` IA-D4/IA-D8)

## 慣例(沿用文管庫紀律)

- 語言:zh-Hant;UI 字串集中放 `constants.ts`,不散落元件
- **串接紀律**:動手寫任何平台 API 串接前,先查**當下**官方文件(端點、HTTP method、參數名、回應值型別逐一對照),文件 URL 註解在 config 常數旁;單元測試斷言**完整請求形狀**;Meta 系 id 可能超 JS 安全整數——從原始回應文字抽取
- 新增純邏輯一律配 vitest 單元測試;hooks 測試以 `// @vitest-environment jsdom` 單檔切環境;E2E 維持 smoke 等級
- 版本與依賴異動需同步 `package-lock.json`(部署用 `npm ci`)
- 與文管庫共用元件採**複製**,不 monorepo;兩產品路線圖互不綁架
- **CI/workflow 教訓見 `docs/INCIDENTS.md`**——改 workflow 前先讀;注入段一律複製文管庫 proven 模式(`env:`+shell `if`),`secrets` 不可用於 step 的 `if:`
- **文件慣例(2026-10-06 對齊文管庫)**:root 僅 `README.md`(對外門面+現況快照)與 `CLAUDE.md`(本檔),其餘全在 `docs/`、全大寫——計畫檔 `-PLAN` 後綴(`docs/M-PLAN.md` 為唯一常駐路線圖,某期決策膨脹才分拆 `<功能>-PLAN.md`)、角色檔用職能名(`SETUP` 串接與驗收手冊/`INCIDENTS` 事故教訓/`BACKEND` 後端首上線才建);計畫檔三段式=決策記錄(D 編號,推翻就地更新+日期)→分期(✅+日期收尾,不刪歷史)→技術要點;驗收分工=操作流程寫 `SETUP`、功能條件寫 `M-PLAN` 分期;CLAUDE.md 待辦採時間軸敘事 append

## 開發待辦與優化清單

**現況(2026-10-20)**:M0+M1 已上線(啟用模式部署成功、bundle 注入驗證);**U1 版面殼層 2026-10-20 開發完成**(三關全綠 49 測/建置/E2E 3,2026-10-20 已部署上線;`docs/IA-PLAN.md` §2 已標 ✅);U2 側欄家族切換 ✅ 2026-10-22;U3 媒庫收件匣/U4 家族排程摘要 2026-10-22 開發完成(正式站驗收待做);**M1 真機驗收進行中**——連線授權+圖片立即發佈(2026-10-08)、影片立即發佈(2026-10-19 改版後 2026-10-20 複測)先後通過;排程/邊界待測(新版面下測,清單=`docs/SETUP.md` §5)。

- **2026-10-06:CI 修復+文件體系建立。**①首次部署失敗=`secrets` 誤用於 step `if:`(workflow 檔層級被拒,零 jobs),改文管庫 proven 模式修復(commit `0d1cc13`),事故歸檔 `docs/INCIDENTS.md` 首篇;②secret 值經維護者重存後部署綠燈,bundle 探測確認 app id/config id 注入(正式站=啟用模式);③文件架構對齊文管庫:`M-PLAN.md` 遷 `docs/`、`SETUP.md`/`LICENSE` 建立、README/CLAUDE 補齊。
- **2026-10-08:M1 真機驗收推進(三障排查+修法,程式零改動)。**①首障=JSSDK 開關未開(後台開啟即時生效);②二障=「不支援 response_type=token」→根因=舊組態 System-user 權杖類型,另建 **User access token 型組態**+維護者換 secret `FB_CONFIG_ID`+Actions 重跑部署(bundle 探測實證新組態 ID 上線);③三障=授權完成但 `/me/accounts` 回空清單→根因=粉專連結商業組合+token 缺 `business_management`(組態補勾即解)——**組態權限定案四項**(三 pages+business_management)。修法後連線+圖片立即發佈通過;實錄與排查方法歸檔 `docs/SETUP.md` §8,M-PLAN D7 組態條款同步改寫。餘:排程/影片/邊界三項驗收。
- **2026-10-09:影片發佈主機更正(驗收前預防修)。**文管庫 session 交接指出 `graph-video.facebook.com` 疑已廢止→查當下官方文件確認(Video API 入門頁明載停用、改用 graph.facebook.com;發佈指南示例仍殘留舊主機,以停用公告為準)→刪 `FB_GRAPH_VIDEO_BASE`、發佈步改走 `FB_GRAPH_BASE`,測試斷言與 M-PLAN D7/SETUP §5 同步。同批交接其餘項(M2 GIS 抽離、M3 workaround 否決與拆期、container 輪詢、contrast-audit 進 CI、crypto 共用時機、平台劃界 IG/X 歸本庫)待維護者拍板。
- **2026-10-11~12:IA 規劃+配額缺陷修復。**①維護者提出版面對齊文管庫→`docs/IA-PLAN.md` 提案(四頁籤命名定案:媒管 Dashboard/編發器 Media/發佈史 History/媒庫 Library;同源契約鍵分級串接;建議 M1 驗收收尾後開工),家族切換對齊提案已送文管庫 session 待確認;②讀碼發現兩產品同源(galen-chu.github.io)共用 localStorage 配額,且歷史寫入配額滿時拋錯被發佈流程 catch 吞掉——貼文已發佈但畫面無反應、誘發重複發佈→修法:`history.persist` 攔截寫入例外、`addRecord` 改回 `{records, saveFailed}` 永不拋出、`App.handlePublish` 記帳移出 try 並於成功提示附註「紀錄未保存」。
- **2026-10-12:IA 規劃收尾歸檔。**①文管庫 session 回饋三點全採納:`family:handoff:v1` 改佇列(上限 20,防連按無聲覆蓋)、handoff/schedule-feed 7 天陳舊判定、配額滿提示不斷言佔用方;契約鍵路線(IA-D4)技術面獲文管庫認同,U2–U4 文管庫側變更待其維護者拍板;②**IA-D8 定案**:跨產品敏感資料僅 Gemini 金鑰可共用(唯讀文管庫鍵,隨媒體 AI 上線),token/郵件內容不流動(理由:token 僅記憶體紅線+平台稽核說法、郵件無需求,且兩站公開、落地後難收回)——紅線節同步補列。下一步:M1 驗收收尾 → 排 U1 版面殼層。
- **2026-10-19:影片上傳路徑改版(Resumable 三步→`source` 單請求)。**M1 驗收影片首測報「網路錯誤」——DevTools 實證 `POST /upload:{session}`(Resumable 二步)被 CORS 預檢擋下:此步依官方文件帶 `Authorization`+`file_offset` 自訂標頭必觸發預檢,該端點不回 `Access-Control-Allow-Origin`(第一步 `uploads` 正常完成=非後台問題;Meta 開發者社群同案,瀏覽器端無解)。修法=影片改 `POST /{page-id}/videos` 的 `source` multipart 單請求(v26.0 文件明載必填;與已驗證成功的圖片 photos 同構同主機):移除 `startVideoUpload`/`uploadVideoBytes`、新增 `buildVideoPublishRequest` 純函式(完整請求形狀測試)+XHR 進度;單請求無斷點續傳,短影片場景可接受。三關全綠(27 測/建置/E2E 2);M-PLAN D7 上傳路徑變更史、SETUP §5 第 4 項/§8 補記同步。部署後 §5 第 4 項複測。
- **2026-10-20:影片驗收通過(§5 第 4 項 ✅)。**`3a6d321` 部署綠燈(bundle 探測:舊碼特徵零殘留、`/videos` 單請求上線),維護者 Ctrl+F5 重測——影片上傳+發佈成功。餘第 3(排程)/第 5(邊界)項,通過後 M1 收尾歸檔。
- **2026-10-20:工具鏈對齊 sprint(commit `408367a`)+U1 版面殼層開發完成。**①工具鏈對齊文管庫 2026-10-06 proven 配方:React 19.3/Vite 8.3/Vitest 5.0/TS 7.0/plugin-react 6.1,零程式改動(useRef 泛型、Uint8Array 均已合規);`vite.config.ts` 補 `pool:'threads'`(Vitest 5 forks 在 Windows 隨機丟檔,文管庫 2026-10-08 教訓);CI actions 升 v7 系(`ubuntu-latest` 2026-10-19 遷 Ubuntu 26,playwright 1.62.1 nativeDeps 已涵蓋 ubuntu26.04);建置 5s→0.4s。②U1 依 IA-PLAN §3.3 定案實作:殼層=文管庫 root flex+Sidebar+`main.app-main`+toast(index.css 設計系統 M0 已整套複製,**零 CSS 改動**);四頁=Dashboard(統計/近期排程純函式 `utils/dashboard.ts`)/編發器兩欄(`.draft-layout` 斷點單欄)/發佈史(篩選 `utils/historyFilters.ts`,排程記錄「待發/應已發佈」)/媒庫(說明素材 `services/library.ts`+家族切換卡);file/previewUrl/caption/mode 留 App 層切頁不遺失;hash 深連結(`tabFromHash`+hashchange+`replaceState`);HistoryCard footer 移至 App 全域;E2E 改 3 測(殼層/`#media` 深連結/頁籤導航)。**三關全綠:49 測(+22)/建置/E2E 3**;SETUP §5 已改寫為頁籤導航版步驟。
- **2026-10-22:U2 側欄家族常駐切換(與文管庫對齊)。**維護者檢核 U1 指出「通往文管庫只在媒庫家族卡、側欄沒有」,與文管庫不一致→比照文管庫 `Sidebar.tsx` 實作:識別塊**外**放「✍️ 文管庫 ↗」(識別塊 ≤720px 整塊隱藏,放外面窄螢幕才有入口)、同 class `.sidebar-family-link`+斷點 `margin-top:auto`;URL 常數改名 `FAMILY_PEER_URL`(側欄與媒庫家族卡共用);E2E +1 測(寬窄螢幕皆可按)。查證文管庫 main 已上線 U3 送出端/U4 排程摘要/L3 金鑰標示——本庫 U3 收件匣成為下一個串接缺口。
- **2026-10-22:U3 媒庫收件匣(家族串接 L1 讀取端)。**新增 `src/services/family/`(`config` 對調 THIS/PEER、`handoff` parse/prune/append 複製自文管庫+讀取端 `loadInbox`/`takeHandoff`);收件匣狀態在 App 層(側欄媒庫徽章、`#handoff`→媒庫、`storage` 事件+focus 即時更新);媒庫頂端「來自文管庫」三動作:套用到編發器/存為說明素材(先存成功才移出,防兩頭落空)/捨棄;取用前重新讀取佇列、只刪 `to`=本庫的該筆。徽章用 `--brand-fill` 白字(已稽核組合)、收件匣項目沿用 surface-soft 底(避開紫底灰字 4.2 未達 AA);說明欄 textarea 補 `aria-labelledby`。單元 +9(58)、E2E +2(6),另以文管庫真實寫入端程式做往返相容測試(臨時、未入庫)。
- **2026-10-22:U4 家族排程摘要(家族串接 L2)。**`services/family/feed.ts`(parse 複製自文管庫;寫入端改由發佈歷史組出未到點排程、前 5 筆、≤60 字片段,說明空則用檔名);App 於發佈歷史變動(含開站)時只寫 `family:schedule-feed:media-message:v1`;媒庫家族卡顯示文管庫近期排程(「資料截至」、陳舊 7 天整區隱藏、已到點項目濾除、`storage` 事件即時更新)。**平台代碼對齊**:摘要 `platform` 沿用文管庫 `PlatformKey`(本庫 `facebook`→`fb`,否則文管庫會顯示原字串),代碼表補記 IA-PLAN §3.2。單元 +6(64)、E2E +1(7)。
- 待辦排隊:§5 第 3/5 項驗收(M1 收尾歸檔)→ U3 正式站驗收(`docs/SETUP.md` §5.1)→ U4 正式站驗收(`docs/SETUP.md` §5.2)→ M2 YouTube(複製文管庫 `services/youtube` 模組)→ M3 Threads/IG(hosted URL 穩定性先查證;**圖床=後端唯一觸發點**,屆時才建 `docs/BACKEND.md`)。
- **候選(2026-10-06 評估,待維護者拍板)**:媒體 AI——一期「看媒體生成說明/標籤」(Gemini 多模態 BYOK 瀏覽器直呼)、二期「圖片 AI 編修」(生成式);評估結論=**零後端可行**,詳 M-PLAN §5 候選註記。

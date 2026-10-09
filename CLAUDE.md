# CLAUDE.md

MEDIA-Message(媒管庫;repo Galen-Chu/MEDIA-Message)— 社群媒體**媒體發佈**工具:媒體為主、文字是說明。與 TEXT-Message(文管庫)為家族產品,技術骨架與慣例整套沿用文管庫(見下);**目前狀態:M0+M1 已上線——正式站啟用模式部署成功(2026-10-06,bundle 注入驗證);M1 真機驗收進行中(2026-10-08:連線授權+圖片發佈已通過,排程/影片/邊界待測;三障實錄=`docs/SETUP.md` §8)**,產品決策 D1–D7 定案見 `docs/M-PLAN.md` §4。

## 常用指令

```bash
npm run dev        # 開發伺服器
npm run build      # 型別檢查 + vite build(+ worker 型別檢查)
npm test           # 單元測試(vitest)
npm run test:e2e   # Playwright E2E(serve dist;跑之前先 npm run build)
```

## 架構(M1;後續期次擴充)

- 前端:React 18 + TypeScript(strict)+ Vite 5(自文管庫複製的同版工具鏈);編輯器第一公民=媒體檔(本地檔案僅記憶體,落地僅 metadata)
- `src/App.tsx` — 編輯器主頁:「附件為主、說明為輔」IA(媒體附件 → 說明 → 發佈 → 發佈歷史)
- `src/services/facebook/` — M1 FB 粉專模組(**D7:瀏覽器端 OAuth、零後端、零 app secret**):`config`(env+Graph v26.0)/`sdk`(FB JS SDK 載入、`FB.login({config_id})` 回短效 user token)/`graph`(`/me/accounts` 錨定抽取 page id、photos multipart 直傳、影片 Resumable Upload API 三步;fetch 可注入)/`schedule`(排程時間窗純邏輯)/`errors`(Graph code 分類)
- `src/hooks/useFacebook.ts` — 連線狀態機(`disabled|disconnected|connecting|connected|error`;token 僅記憶體、過期導向重連);`publish` 統一入口(檔案驗證+排程驗證+分派圖/影片路徑+影片進度)
- `src/services/history.ts` — 發佈歷史:僅 metadata 落地(localStorage `media-message:v1`,上限 200 筆,storage 可注入)
- `src/components/` — `MediaPicker`(附件選檔+預覽)/`PublishPanel`(連線+粉專選擇+立即/排程+進度)/`HistoryCard`
- `src/utils/mediaKind.ts` — 媒體類型偵測(MIME 前綴,缺漏時副檔名 fallback);`src/utils/format.ts` — 大小/時間顯示格式化
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

## 慣例(沿用文管庫紀律)

- 語言:zh-Hant;UI 字串集中放 `constants.ts`,不散落元件
- **串接紀律**:動手寫任何平台 API 串接前,先查**當下**官方文件(端點、HTTP method、參數名、回應值型別逐一對照),文件 URL 註解在 config 常數旁;單元測試斷言**完整請求形狀**;Meta 系 id 可能超 JS 安全整數——從原始回應文字抽取
- 新增純邏輯一律配 vitest 單元測試;hooks 測試以 `// @vitest-environment jsdom` 單檔切環境;E2E 維持 smoke 等級
- 版本與依賴異動需同步 `package-lock.json`(部署用 `npm ci`)
- 與文管庫共用元件採**複製**,不 monorepo;兩產品路線圖互不綁架
- **CI/workflow 教訓見 `docs/INCIDENTS.md`**——改 workflow 前先讀;注入段一律複製文管庫 proven 模式(`env:`+shell `if`),`secrets` 不可用於 step 的 `if:`
- **文件慣例(2026-10-06 對齊文管庫)**:root 僅 `README.md`(對外門面+現況快照)與 `CLAUDE.md`(本檔),其餘全在 `docs/`、全大寫——計畫檔 `-PLAN` 後綴(`docs/M-PLAN.md` 為唯一常駐路線圖,某期決策膨脹才分拆 `<功能>-PLAN.md`)、角色檔用職能名(`SETUP` 串接與驗收手冊/`INCIDENTS` 事故教訓/`BACKEND` 後端首上線才建);計畫檔三段式=決策記錄(D 編號,推翻就地更新+日期)→分期(✅+日期收尾,不刪歷史)→技術要點;驗收分工=操作流程寫 `SETUP`、功能條件寫 `M-PLAN` 分期;CLAUDE.md 待辦採時間軸敘事 append

## 開發待辦與優化清單

**現況(2026-10-08)**:M0+M1 已上線(啟用模式部署成功、bundle 注入驗證);**M1 真機驗收進行中**——連線授權+圖片立即發佈已通過(2026-10-08),排程/影片/邊界待測(清單=`docs/SETUP.md` §5;首次實測關注:影片 file_type 是否限 mp4、瀏覽器直傳 `/{page-id}/videos` 的 CORS——2026-10-09 已改走 graph.facebook.com)。

- **2026-10-06:CI 修復+文件體系建立。**①首次部署失敗=`secrets` 誤用於 step `if:`(workflow 檔層級被拒,零 jobs),改文管庫 proven 模式修復(commit `0d1cc13`),事故歸檔 `docs/INCIDENTS.md` 首篇;②secret 值經維護者重存後部署綠燈,bundle 探測確認 app id/config id 注入(正式站=啟用模式);③文件架構對齊文管庫:`M-PLAN.md` 遷 `docs/`、`SETUP.md`/`LICENSE` 建立、README/CLAUDE 補齊。
- **2026-10-08:M1 真機驗收推進(三障排查+修法,程式零改動)。**①首障=JSSDK 開關未開(後台開啟即時生效);②二障=「不支援 response_type=token」→根因=舊組態 System-user 權杖類型,另建 **User access token 型組態**+維護者換 secret `FB_CONFIG_ID`+Actions 重跑部署(bundle 探測實證新組態 ID 上線);③三障=授權完成但 `/me/accounts` 回空清單→根因=粉專連結商業組合+token 缺 `business_management`(組態補勾即解)——**組態權限定案四項**(三 pages+business_management)。修法後連線+圖片立即發佈通過;實錄與排查方法歸檔 `docs/SETUP.md` §8,M-PLAN D7 組態條款同步改寫。餘:排程/影片/邊界三項驗收。
- **2026-10-09:影片發佈主機更正(驗收前預防修)。**文管庫 session 交接指出 `graph-video.facebook.com` 疑已廢止→查當下官方文件確認(Video API 入門頁明載停用、改用 graph.facebook.com;發佈指南示例仍殘留舊主機,以停用公告為準)→刪 `FB_GRAPH_VIDEO_BASE`、發佈步改走 `FB_GRAPH_BASE`,測試斷言與 M-PLAN D7/SETUP §5 同步。同批交接其餘項(M2 GIS 抽離、M3 workaround 否決與拆期、container 輪詢、contrast-audit 進 CI、crypto 共用時機、平台劃界 IG/X 歸本庫)待維護者拍板。
- 待辦排隊:M2 YouTube(複製文管庫 `services/youtube` 模組)→ M3 Threads/IG(hosted URL 穩定性先查證;**圖床=後端唯一觸發點**,屆時才建 `docs/BACKEND.md`)。
- **候選(2026-10-06 評估,待維護者拍板)**:媒體 AI——一期「看媒體生成說明/標籤」(Gemini 多模態 BYOK 瀏覽器直呼)、二期「圖片 AI 編修」(生成式);評估結論=**零後端可行**,詳 M-PLAN §5 候選註記。

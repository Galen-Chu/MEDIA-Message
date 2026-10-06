# CLAUDE.md

MEDIA-Message(媒管庫;repo Galen-Chu/MEDIA-Message)— 社群媒體**媒體發佈**工具:媒體為主、文字是說明。與 TEXT-Message(文管庫)為家族產品,技術骨架與慣例整套沿用文管庫(見下);**目前狀態:M0 骨架完成、M1 FB 粉專媒體發佈實作完成(2026-10-05,待真機端到端驗收)**,產品決策 D1–D7 定案見 `M-PLAN.md` §4。

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

- 本機:`.env.local` 填 `VITE_FB_APP_ID`/`VITE_FB_CONFIG_ID`(皆非機密;範本見 `.env.example`,值來源與後台設定=文管庫 `docs/BACKEND.md` §7.2,組態沿用文管庫三項權限免另建)
- 正式:GitHub secrets `FB_APP_ID`/`FB_CONFIG_ID` → `deploy.yml` 選用注入 `.env.production`(缺 secret=示範模式建置,不得失敗)
- 後台唯一動作:Meta App 設定加入本站網域(localhost 開發 + GitHub Pages 網域)

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

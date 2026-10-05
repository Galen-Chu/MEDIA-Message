# CLAUDE.md

MEDIA-Message(媒管庫;repo Galen-Chu/MEDIA-Message)— 社群媒體**媒體發佈**工具:媒體為主、文字是說明。與 TEXT-Message(文管庫)為家族產品,技術骨架與慣例整套沿用文管庫(見下);**目前狀態:M0 骨架完成(2026-10-05)、M1 開發中(待 D7 決策)**,產品決策與分期見 `M-PLAN.md`(D1–D6 為暫行決議,動工前可推翻)。

## 常用指令

```bash
npm run dev        # 開發伺服器
npm run build      # 型別檢查 + vite build(+ worker 型別檢查)
npm test           # 單元測試(vitest)
npm run test:e2e   # Playwright E2E(serve dist;跑之前先 npm run build)
```

## 架構(M0 骨架;M1 起擴充)

- 前端:React 18 + TypeScript(strict)+ Vite 5(自文管庫複製的同版工具鏈);編輯器第一公民=媒體檔(本地檔案僅記憶體,落地僅 metadata)
- `src/App.tsx` — M0 殼層(品牌定位/產品狀態/平台規劃);M1 將以「附件為主、說明為輔」編輯器 IA 取代
- `src/utils/mediaKind.ts` — 媒體類型偵測純函式(MIME 前綴,缺漏時副檔名 fallback),配 vitest 單元測試
- `src/index.css` — 設計系統自文管庫整套複製(深色模式、WCAG AA 已驗證 token;調整 palette 時重跑 `scripts/contrast-audit.mjs`)
- `vite.config.ts` 的 `base: '/MEDIA-Message/'` 為 Pages 子路徑所需,勿移除
- 後端輔助(可選):Cloudflare Workers + KV,職責僅限平台 OAuth 代管(token 加密保存)與 API 代呼叫——**媒體絕不過後端、worker 佇列不承載媒體**;排程一律平台原生(YouTube `publishAt`、FB `scheduled_publish_time`)
- caption AI:Gemini BYOK 模組複製自文管庫(語氣/角色/語言),key 僅存使用者瀏覽器

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

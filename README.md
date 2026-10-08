# MEDIA-Message(媒管庫)

社群媒體**媒體發佈**工具——媒體為主、文字是說明。選擇本地圖片/影音檔,撰寫說明後直傳平台發佈,排程一律使用平台原生機制(媒體絕不落地、絕不經過後端)。

TEXT-Message(文管庫)的家族產品:[文管庫](https://github.com/Galen-Chu/TEXT-Message)負責文字工作流(郵件→草稿→AI 改寫→發文),本產品負責媒體工作流。

**狀態:M0+M1 已上線**——[正式站](https://galen-chu.github.io/MEDIA-Message/)啟用模式部署成功(2026-10-06),M1 真機驗收進行中(2026-10-08 連線與圖片發佈已通過,清單見 [`docs/SETUP.md`](docs/SETUP.md) §5)。產品規劃、平台能力查證與分期見 [`docs/M-PLAN.md`](docs/M-PLAN.md)。

## 平台支援(規劃)

| 平台 | 圖片 | 影片 | 排程 |
| --- | --- | --- | --- |
| Facebook 粉專 | 直傳 | 直傳 | 原生 `scheduled_publish_time` |
| YouTube | — | 規劃中(M2) | 原生 `publishAt` |
| Threads / Instagram | 規劃中(M3,平台 API 限制需公開網址) | 規劃中(M3) | — |

## 功能一覽(M1:FB 粉專媒體發佈)

| 區塊 | 說明 |
| --- | --- |
| 媒體附件 | 選擇本地圖片/影片檔(僅存記憶體,絕不落地),即時預覽與規則提示(圖片 ≤4MB、jpeg/bmp/png/gif/tiff) |
| 說明 | 附件的說明文字(本產品「文字是說明」) |
| 發佈——Facebook 粉專 | **瀏覽器端 OAuth 連線**(零後端、零 app secret;token 僅記憶體)→ 選粉專 → 立即發佈或排程(平台原生 `scheduled_publish_time`);影片走 Resumable 上傳三步並顯示進度 |
| 發佈歷史 | 僅 metadata(檔名/類型/大小/說明/時間)存於各自瀏覽器 localStorage |

未設定 `VITE_FB_APP_ID` 的建置為**示範模式**(不出現連線按鈕),建置不會失敗。

## 開發

```bash
npm install
npm run dev      # 開發伺服器
npm run build    # 型別檢查 + 產出 dist/
npm test         # 單元測試(vitest)
npm run test:e2e # E2E smoke(Playwright,serve dist;需先 npm run build)
```

本機要連真實 Facebook:依 [`docs/SETUP.md`](docs/SETUP.md) §3,複製 `.env.example` 為 `.env.local` 填入兩個非機密 ID。

## 部署(GitHub Pages 自動部署)

push 到 `main` 即觸發 `.github/workflows/deploy.yml`:單元測試 → 建置 → E2E smoke(部署閘門)→ 發佈到 GitHub Pages。PR 另有 CI 檢查(`.github/workflows/ci.yml`)。

若 repo secrets `FB_APP_ID`/`FB_CONFIG_ID` 已設定,建置時注入、正式站可連接真實 Facebook(設定教學見 [`docs/SETUP.md`](docs/SETUP.md) §4);未設定則部署為示範模式。CI 教訓與事故紀錄見 [`docs/INCIDENTS.md`](docs/INCIDENTS.md)。

> 隱私說明:本專案**沒有後端**。媒體檔僅存在瀏覽器記憶體,上傳時由瀏覽器直接送往平台;access token 僅存記憶體,關頁即消失;發佈歷史僅 metadata 存於各自瀏覽器。詳見 [`docs/SETUP.md`](docs/SETUP.md) §7。

## 專案結構

```
src/
  components/          # MediaPicker、PublishPanel、HistoryCard
  hooks/               # useFacebook:連線狀態機(token 僅記憶體)
  services/facebook/   # config/sdk/graph/schedule/errors(fetch 可注入)
  services/history.ts  # 發佈歷史(僅 metadata)
  utils/ constants.ts  # 媒體類型偵測、格式化;UI 字串集中
e2e/                   # Playwright smoke
docs/                  # M-PLAN(路線圖)、SETUP(串接與驗收手冊)、INCIDENTS(事故教訓)
```

## 發展路線

M0 ✅ → M1 FB 粉專媒體發佈(✅ 實作完成;真機驗收進行中——連線/圖片已通過)→ M2 YouTube(複製文管庫上傳模組)→ M3 Threads/IG(需公開網址,含圖床決策)→ 候選:媒體 AI(看媒體生成說明/圖片 AI 編修,零後端可行,待拍板)→ 遠期:聲音線。決策記錄 D1–D7 與各期細節見 [`docs/M-PLAN.md`](docs/M-PLAN.md)。

## 文件導覽

- [`docs/M-PLAN.md`](docs/M-PLAN.md) — 產品規劃:定位、平台能力查證、決策記錄 D1–D7、分期
- [`docs/SETUP.md`](docs/SETUP.md) — 串接設定與驗收測試手冊(維護者/驗收測試者/自架者)
- [`docs/INCIDENTS.md`](docs/INCIDENTS.md) — 事故與教訓紀錄(現象/根因/修復/防再發)
- [`CLAUDE.md`](CLAUDE.md) — 工程慣例:架構、紅線、CI/CD、開發待辦


## 授權

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

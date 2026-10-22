# MEDIA-Message(媒管庫)

社群媒體**媒體發佈**工具——媒體為主、文字是說明。選擇本地圖片/影音檔,撰寫說明後直傳平台發佈,排程一律使用平台原生機制(媒體絕不落地、絕不經過後端)。

TEXT-Message(文管庫)的家族產品:[文管庫](https://github.com/Galen-Chu/TEXT-Message)負責文字工作流(郵件→草稿→AI 改寫→發文),本產品負責媒體工作流。

**狀態:M0+M1 已上線**——[正式站](https://galen-chu.github.io/MEDIA-Message/)啟用模式部署成功(2026-10-06),M1 真機驗收進行中(2026-10-08 連線與圖片發佈、2026-10-20 影片發佈已通過,排程/邊界待測,清單見 [`docs/SETUP.md`](docs/SETUP.md) §5)。U1 版面殼層(側欄四頁籤)2026-10-20 上線;與文管庫的家族串接(側欄互連、說明交接、互看排程)2026-10-22 上線並驗收。產品規劃、平台能力查證與分期見 [`docs/M-PLAN.md`](docs/M-PLAN.md)。

## 平台支援(規劃)

| 平台 | 圖片 | 影片 | 排程 |
| --- | --- | --- | --- |
| Facebook 粉專 | 直傳 | 直傳 | 原生 `scheduled_publish_time` |
| YouTube | — | 規劃中(M2) | 原生 `publishAt` |
| Threads / Instagram | 規劃中(M3,平台 API 限制需公開網址) | 規劃中(M3) | — |

## 功能一覽(M1+U1–U4)

| 區塊 | 說明 |
| --- | --- |
| 版面殼層(U1) | 側欄四頁籤:🏠 媒管 Dashboard(發佈統計+近期排程+連線摘要)/🎬 編發器 Media(兩欄,窄螢幕自動單欄)/📅 發佈史 History(發佈方式×媒體類型篩選)/🗂️ 媒庫 Library(說明素材);`#media` 等 hash 深連結可直達頁籤;切換頁籤不遺失選好的檔案與說明 |
| 家族串接(U2–U4) | 與文管庫(TEXT-Message)同源零後端串接:側欄常駐「文管庫 ↗」;媒庫收件匣接收文管庫「送至媒管庫」的文案(套用到編發器/存為素材/捨棄,側欄徽章、`#handoff` 深連結、即時更新);媒庫家族卡互看雙方近期排程。只交換文字與 metadata——媒體檔、token、郵件內容不流動 |
| 媒體附件 | 選擇本地圖片/影片檔(僅存記憶體,絕不落地),即時預覽與規則提示(圖片 ≤4MB、jpeg/bmp/png/gif/tiff) |
| 說明 | 附件的說明文字(本產品「文字是說明」) |
| 發佈——Facebook 粉專 | **瀏覽器端 OAuth 連線**(零後端、零 app secret;token 僅記憶體)→ 選粉專 → 立即發佈或排程(平台原生 `scheduled_publish_time`);圖片/影片 multipart 直傳(XHR 上傳進度) |
| 發佈歷史 | 僅 metadata(檔名/類型/大小/說明/時間)存於各自瀏覽器 localStorage;排程記錄顯示「待發/應已發佈」 |
| 媒庫(說明素材) | 儲存常用說明/標籤組為純文字範本(本機 localStorage),一鍵套用到編發器;家族切換連結前往文管庫 |

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
  components/          # Sidebar、Dashboard、History、Library、MediaPicker、PublishPanel、HistoryCard
  hooks/               # useFacebook:連線狀態機(token 僅記憶體)
  services/facebook/   # config/sdk/graph/schedule/errors(fetch 可注入)
  services/history.ts  # 發佈歷史(僅 metadata)
  services/library.ts  # 媒庫說明素材(純文字範本)
  utils/ constants.ts  # 媒體類型偵測、Dashboard 統計、發佈史篩選、格式化;UI 字串集中
e2e/                   # Playwright smoke
docs/                  # M-PLAN(路線圖)、IA-PLAN(版面與家族串接)、SETUP(串接與驗收手冊)、INCIDENTS(事故教訓)
```

## 發展路線

M0 ✅ → M1 FB 粉專媒體發佈(✅ 實作完成;真機驗收——連線/圖片/影片已通過,排程/邊界待測)→ U1 版面殼層 ✅(2026-10-20)→ 家族串接 U2–U4 ✅(2026-10-22)→ M2 YouTube(複製文管庫上傳模組)→ M3 Threads/IG(需公開網址,含圖床決策)→ 候選:媒體 AI(看媒體生成說明/圖片 AI 編修,零後端可行,待拍板)→ 遠期:聲音線。決策記錄 D1–D7 與各期細節見 [`docs/M-PLAN.md`](docs/M-PLAN.md),版面規劃見 [`docs/IA-PLAN.md`](docs/IA-PLAN.md)。

## 文件導覽

- [`docs/M-PLAN.md`](docs/M-PLAN.md) — 產品規劃:定位、平台能力查證、決策記錄 D1–D7、分期
- [`docs/IA-PLAN.md`](docs/IA-PLAN.md) — 版面對齊文管庫+家族串接規劃(U1–U5)
- [`docs/SETUP.md`](docs/SETUP.md) — 串接設定與驗收測試手冊(維護者/驗收測試者/自架者)
- [`docs/INCIDENTS.md`](docs/INCIDENTS.md) — 事故與教訓紀錄(現象/根因/修復/防再發)
- [`CLAUDE.md`](CLAUDE.md) — 工程慣例:架構、紅線、CI/CD、開發待辦


## 授權

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

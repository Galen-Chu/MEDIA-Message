# MEDIA-Message(媒管庫)

社群媒體**媒體發佈**工具——媒體為主、文字是說明。選擇本地圖片/影音檔,撰寫說明後直傳平台發佈,排程一律使用平台原生機制(媒體絕不落地、絕不經過後端)。

TEXT-Message(文管庫)的家族產品:[文管庫](https://github.com/Galen-Chu/TEXT-Message)負責文字工作流(郵件→草稿→AI 改寫→發文),本產品負責媒體工作流。

**狀態:M0 骨架完成(2026-10-05),M1 開發中**——產品規劃、平台能力查證與分期見 [M-PLAN.md](./M-PLAN.md)。

## 平台支援(規劃)

| 平台 | 圖片 | 影片 | 排程 |
| --- | --- | --- | --- |
| Facebook 粉專 | 直傳 | 直傳 | 原生 `scheduled_publish_time` |
| YouTube | — | 規劃中(M2) | 原生 `publishAt` |
| Threads / Instagram | 規劃中(M3,平台 API 限制需公開網址) | 規劃中(M3) | — |

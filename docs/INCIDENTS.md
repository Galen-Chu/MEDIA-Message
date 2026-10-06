# 事故與教訓紀錄

避免重蹈:新事故往下追加,每筆必含**現象/根因/修復/防再發**。動手改 CI/workflow 前先讀完本檔。

## 2026-10-06 首次部署瞬間失敗——secrets context 不可用於 step 的 if:

- **現象**:push `7bf5760` 後 run [37405906031](https://github.com/Galen-Chu/MEDIA-Message/actions/runs/37405906031) 秒敗——`created_at == run_started_at == updated_at`,jobs 與 check-runs 全空(零 jobs),匿名 API 看不到任何錯誤訊息。
- **根因**:`deploy.yml` 注入步驟寫了 `if: ${{ secrets.FB_APP_ID != '' && secrets.FB_CONFIG_ID != '' }}`。官方 [context availability 表](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#context-availability):`jobs.<job_id>.steps.if` 允許的 context 僅 `github, needs, strategy, matrix, job, runner, env, vars, steps, inputs`——**不含 `secrets`**。workflow 檔在設置階段即被拒,job 從未啟動。此寫法在網路範例常見,實際違規。
- **修復**:commit `0d1cc13` 改為文管庫 production-proven 模式——secret 進步驟 `env:`、條件判斷移入 shell:

  ```yaml
  - name: Write optional FB env
    env:
      FB_APP_ID: ${{ secrets.FB_APP_ID }}
      FB_CONFIG_ID: ${{ secrets.FB_CONFIG_ID }}
    run: |
      if [ -n "$FB_APP_ID" ] && [ -n "$FB_CONFIG_ID" ]; then
        printf 'VITE_FB_APP_ID=%s\nVITE_FB_CONFIG_ID=%s\n' "$FB_APP_ID" "$FB_CONFIG_ID" > .env.production
      fi
  ```

  缺任一 secret 不寫檔=示範模式建置,行為不變。修復後 run [37406564536](https://github.com/Galen-Chu/MEDIA-Message/actions/runs/37406564536) 全綠、正式站上線。
- **為何本地三關沒抓到**:YAML 語法本身合法(`js-yaml` 解析通過),單元/建置/E2E 都不碰 workflow 語意——只有 GitHub runtime 驗證會拒。此類錯誤本地無法攔截,靠紀律預防。
- **防再發**:
  1. workflow 檔比照元件採**複製 proven 模式**——注入段抄文管庫 `TEXT-Message/.github/workflows/deploy.yml`,不徒手變體;
  2. 診斷口訣:**「瞬間失敗 + 零 jobs」= workflow 檔層級錯誤**(context 可用性、`on:`/語法),不必往下游查;
  3. 部署後以 bundle 探測驗證注入(curl 正式站 JS、grep 值)——注入步驟顯示 success ≠ 有寫檔(缺 secret 時靜默跳過也是 success)。

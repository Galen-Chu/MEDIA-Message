import { defineConfig } from '@playwright/test';

/**
 * E2E smoke:跑在 `npm run preview`(serve dist,含 base 路徑)。
 * CI 環境為 M0 骨架建置(無任何平台串接),smoke 僅驗證殼層載入與規劃資訊,
 * 不觸碰任何平台網路。
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: true,
  // 沿用文管庫實測調校:限 4 workers+一律重試 1 次,避免本機高負載時 actionability 隨機逾時
  workers: 4,
  retries: 1,
  reporter: process.env.CI ? 'list' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/MEDIA-Message/',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});

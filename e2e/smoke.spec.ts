import { expect, test } from '@playwright/test';

const PATH = '/MEDIA-Message/';

test('載入:標題與品牌定位', async ({ page }) => {
  await page.goto(PATH);
  await expect(page).toHaveTitle('MEDIA-Message');
  await expect(page.getByRole('heading', { level: 1, name: /媒管庫/ })).toBeVisible();
  await expect(page.getByText('媒體為主,文字是說明', { exact: false })).toBeVisible();
});

test('編輯器 IA 與發佈歷史可見(CI=示範模式建置)', async ({ page }) => {
  await page.goto(PATH);
  // 附件為主、說明為輔的編輯器四卡
  for (const heading of ['媒體附件', '說明', '發佈——Facebook 粉專', '發佈歷史']) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
  // 未設 env 的建置=降級模式:顯示提示且發佈鈕停用(建置不得失敗的 CI 常態驗證)
  await expect(page.getByText('尚未設定 Facebook 連線參數', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: '立即發佈' })).toBeDisabled();
  await expect(page.getByText('尚無發佈記錄')).toBeVisible();
});

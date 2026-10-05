import { expect, test } from '@playwright/test';

const PATH = '/MEDIA-Message/';

test('載入:標題與品牌定位', async ({ page }) => {
  await page.goto(PATH);
  await expect(page).toHaveTitle('MEDIA-Message');
  await expect(page.getByRole('heading', { level: 1, name: /媒管庫/ })).toBeVisible();
  await expect(page.getByText('媒體為主,文字是說明', { exact: false })).toBeVisible();
});

test('狀態與平台支援規劃可見', async ({ page }) => {
  await page.goto(PATH);
  await expect(page.getByText('產品狀態')).toBeVisible();
  await expect(page.getByText('M0 骨架', { exact: false })).toBeVisible();
  for (const name of ['Facebook 粉專', 'YouTube', 'Threads / Instagram']) {
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }
});

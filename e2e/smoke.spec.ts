import { expect, test } from '@playwright/test';

const PATH = '/MEDIA-Message/';

test('殼層:側欄四頁籤與 Dashboard 預設頁', async ({ page }) => {
  await page.goto(PATH);
  await expect(page).toHaveTitle('MEDIA-Message');
  // 四頁籤按鈕(名稱含圖示,以子字串比對)
  for (const tabName of ['媒管 Dashboard', '編發器 Media', '發佈史 History', '媒庫 Library']) {
    await expect(page.getByRole('button', { name: tabName })).toBeVisible();
  }
  // 預設落在 Dashboard:h1+定位語+連線狀態卡+開始發佈入口+統計區
  await expect(page.getByRole('heading', { level: 1, name: /媒管 Dashboard/ })).toBeVisible();
  await expect(page.getByText('媒體為主,文字是說明', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: '連線狀態' })).toBeVisible();
  await expect(page.getByText('本月已發佈')).toBeVisible();
  await expect(page.getByRole('button', { name: '開始發佈' })).toBeVisible();
});

test('#media 深連結直達編發器(示範與啟用模式建置皆須通過)', async ({ page }) => {
  await page.goto(`${PATH}#media`);
  await expect(page.getByRole('heading', { level: 1, name: /編發器/ })).toBeVisible();
  // 附件為主、說明為輔的編輯器三卡
  for (const heading of ['媒體附件', '說明', '發佈——Facebook 粉專']) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
  // 模式分歧點:CI 無 env=示範模式(降級提示);正式建置有 env=連線區出現。
  // 兩種建置的 E2E 都要過(ci.yml 示範模式、deploy.yml 啟用模式=E2E 為部署閘門)
  const demoNote = page.getByText('尚未設定 Facebook 連線參數', { exact: false });
  const connectButton = page.getByRole('button', { name: '連接 Facebook' });
  await expect(demoNote.or(connectButton)).toBeVisible();
  // 無附件+未連線:發佈鈕兩種模式下皆停用
  await expect(page.getByRole('button', { name: '立即發佈' })).toBeDisabled();
});

test('頁籤導航:發佈史與媒庫頁', async ({ page }) => {
  await page.goto(PATH);
  await page.getByRole('button', { name: '發佈史 History' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /發佈史/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: '發佈歷史' })).toBeVisible();
  await expect(page.getByText('尚無發佈記錄')).toBeVisible();
  // 篩選 chips(兩組各有「全部」)
  await expect(page.getByRole('group', { name: '發佈方式' })).toBeVisible();
  await expect(page.getByRole('group', { name: '媒體類型' })).toBeVisible();

  await page.getByRole('button', { name: '媒庫 Library' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /媒庫/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: '說明素材' })).toBeVisible();
  await expect(page.getByRole('link', { name: '前往文管庫 ↗' })).toHaveAttribute(
    'href',
    'https://galen-chu.github.io/TEXT-Message/',
  );
});

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

test('側欄家族常駐切換(U2,與文管庫同位置):寬窄螢幕皆可按', async ({ page }) => {
  await page.goto(PATH);
  const familyLink = page.getByRole('link', { name: '文管庫 ↗', exact: true });
  await expect(familyLink).toBeVisible();
  await expect(familyLink).toHaveAttribute('href', 'https://galen-chu.github.io/TEXT-Message/');
  // ≤720px:識別塊整塊隱藏,連結仍在(只留圖示,名稱改由 title 提供)
  await page.setViewportSize({ width: 640, height: 800 });
  await expect(page.locator('.sidebar-family-link')).toBeVisible();
  await expect(page.locator('.sidebar-footer')).toBeHidden();
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

// U3 收件匣:以文管庫 sendCaptionToPeer 實際寫入的形狀注入 family:handoff:v1(契約 IA-PLAN §3.2)
const HANDOFF_KEY = 'family:handoff:v1';
function handoffQueue(items: Array<{ id: string; text: string; to?: string }>) {
  return JSON.stringify({
    v: 1,
    items: items.map((i) => ({
      id: i.id,
      from: 'text-message',
      to: i.to ?? 'media-message',
      kind: 'caption',
      text: i.text,
      createdAt: Date.now(),
    })),
  });
}

test('U3 收件匣:#handoff 落媒庫、徽章計數、套用後帶入說明並移出佇列', async ({ page }) => {
  const queue = handoffQueue([
    { id: 'h1', text: '文管庫送來的第一段文案' },
    { id: 'toText', text: '送往文管庫的(不該出現)', to: 'text-message' },
  ]);
  await page.goto(PATH);
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [HANDOFF_KEY, queue] as const);
  await page.goto(`${PATH}#handoff`);
  await page.reload();

  await expect(page.getByRole('heading', { level: 1, name: /媒庫/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: '來自文管庫(1)' })).toBeVisible();
  await expect(page.getByText('文管庫送來的第一段文案')).toBeVisible();
  await expect(page.getByText('送往文管庫的(不該出現)')).toHaveCount(0);
  await expect(page.getByLabel('收件匣有 1 筆來自文管庫的文案')).toBeVisible();

  await page.getByRole('button', { name: '套用到編發器' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: /編發器/ })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '說明' })).toHaveValue('文管庫送來的第一段文案');
  await expect(page.getByLabel(/收件匣有/)).toHaveCount(0);
  // 只移除取用的那筆;送往文管庫的項目原封不動
  const left = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), HANDOFF_KEY);
  expect(left.items.map((i: { id: string }) => i.id)).toEqual(['toText']);
});

test('U3 收件匣:文管庫分頁送出時即時更新(storage 事件)', async ({ context }) => {
  const media = await context.newPage();
  await media.goto(`${PATH}#library`);
  await expect(media.getByText('收件匣目前沒有來自文管庫的文案', { exact: false })).toBeVisible();

  // 另一分頁(同源)寫入佇列=模擬文管庫按「送至媒管庫」
  const peer = await context.newPage();
  await peer.goto(PATH);
  await peer.evaluate(
    ([k, v]) => localStorage.setItem(k, v),
    [HANDOFF_KEY, handoffQueue([{ id: 'live', text: '即時送達的文案' }])] as const,
  );

  await expect(media.getByRole('heading', { name: '來自文管庫(1)' })).toBeVisible();
  await expect(media.getByText('即時送達的文案')).toBeVisible();
});

test('U4 排程摘要:開站即寫自己的摘要(fb 代碼);媒庫顯示文管庫近期排程', async ({ page }) => {
  const soon = Date.now() + 3_600_000;
  await page.goto(PATH);
  await page.evaluate(
    ([soonMs]) => {
      // 本庫發佈歷史:一筆未到點的排程(media-message:v1 的既有形狀)
      localStorage.setItem(
        'media-message:v1',
        JSON.stringify({
          version: 1,
          records: [
            {
              id: 'r1', platform: 'facebook', mode: 'schedule', mediaName: 'a.jpg', mediaKind: 'image',
              mediaSize: 1, caption: '媒管庫排程貼文', createdAt: Date.now(), scheduledFor: soonMs, postId: null,
            },
          ],
        }),
      );
      // 文管庫 buildScheduleFeed 實際寫入的形狀
      localStorage.setItem(
        'family:schedule-feed:text-message:v1',
        JSON.stringify({
          v: 1, product: 'text-message', updatedAt: Date.now(),
          items: [{ platform: 'threads', when: soonMs, snippet: '文管庫的 Threads 排程' }],
        }),
      );
    },
    [soon] as const,
  );
  await page.goto(`${PATH}#library`);
  await page.reload();

  const own = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('family:schedule-feed:media-message:v1') ?? 'null'),
  );
  expect(own).toMatchObject({ v: 1, product: 'media-message' });
  expect(own.items).toEqual([{ platform: 'fb', when: soon, snippet: '媒管庫排程貼文' }]);

  const feedList = page.getByRole('list', { name: '文管庫近期排程' });
  await expect(feedList).toBeVisible();
  await expect(feedList.getByText('Threads', { exact: true })).toBeVisible();
  await expect(feedList.getByText('文管庫的 Threads 排程')).toBeVisible();
  await expect(page.getByText(/資料截至/)).toBeVisible();
});

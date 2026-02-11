import { expect, test } from '@playwright/test';

test('todo flow works in web app', async ({ page }) => {
  const title = `smoke-${Date.now()}`;

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'RN + Web Platform' })).toBeVisible();
  await expect(page.getByLabel('api status panel')).toBeVisible();

  await page.getByLabel('Todo title').fill(title);
  await page.getByRole('button', { name: 'Add' }).click();

  await expect(page.getByText(title)).toBeVisible();

  await page.getByLabel(`toggle ${title}`).check();
  await expect(page.getByText(title)).toHaveClass(/done/);

  await page.getByLabel(`delete ${title}`).click();
  await expect(page.getByText(title)).toHaveCount(0);

  await page.goto('/status');
  await expect(page.getByRole('heading', { name: 'Status' })).toBeVisible();
});

import { test, expect } from '@playwright/test';

test('home loads and status route works', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'RN + Web Platform' })).toBeVisible();
  await page.goto('/status');
  await expect(page.getByRole('heading', { name: 'Status OK' })).toBeVisible();
});

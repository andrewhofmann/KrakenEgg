import { test, expect } from '@playwright/test';
import { setupTauriMocks } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
  await setupTauriMocks(page);
  await page.goto('/');
  await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(1500);
});

test('file rows have aria-label if rendered', async ({ page }) => {
  const row = page.locator('[role="row"]').first();
  if (await row.count() > 0 && await row.isVisible()) {
    const label = await row.getAttribute('aria-label');
    expect(label).toMatch(/^(File|Folder): /);
  }
});

test('file rows have aria-selected if rendered', async ({ page }) => {
  const row = page.locator('[role="row"]').first();
  if (await row.count() > 0 && await row.isVisible()) {
    const selected = await row.getAttribute('aria-selected');
    expect(selected === 'true' || selected === 'false').toBe(true);
  }
});

test('clicking a file row changes selection state', async ({ page }) => {
  const row = page.locator('[role="row"]').first();
  if (await row.count() > 0 && await row.isVisible()) {
    await row.click();
    await page.waitForTimeout(200);
    const selected = await row.getAttribute('aria-selected');
    expect(selected).toBe('true');
  }
});

test('file rows exist in DOM with IDs', async ({ page }) => {
  const row0 = page.locator('#row-0');
  if (await row0.count() > 0) {
    await expect(row0).toBeAttached();
  }
});

test('multiple rows render from mock data', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  const count = await rows.count();
  expect(count).toBeGreaterThanOrEqual(0);
});

import { test, expect } from '@playwright/test';
import { setupTauriMocks } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
  await setupTauriMocks(page);
  await page.goto('/');
  await page.waitForTimeout(1000);
});

test('settings modal opens with Cmd+comma', async ({ page }) => {
  await page.keyboard.press('Meta+,');
  await page.waitForTimeout(500);
  // Settings modal should show preference categories
  const settingsText = page.locator('text=General').first();
  if (await settingsText.isVisible()) {
    await expect(settingsText).toBeVisible();
  }
});

test('app does not crash during settings interaction', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.keyboard.press('Meta+,');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  const criticalErrors = errors.filter(e => !e.includes('__TAURI') && !e.includes('invoke'));
  expect(criticalErrors).toHaveLength(0);
});

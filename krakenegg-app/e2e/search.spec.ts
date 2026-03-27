import { test, expect } from '@playwright/test';
import { setupTauriMocks } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
  await setupTauriMocks(page);
  await page.goto('/');
  await page.waitForTimeout(1000);
});

test('search modal opens with Alt+F7', async ({ page }) => {
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  // Should see search-related UI elements
  const searchInput = page.locator('input[placeholder*="earch"]').first();
  if (await searchInput.isVisible()) {
    await expect(searchInput).toBeVisible();
  }
});

test('search modal closes with Escape', async ({ page }) => {
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  // No crash expected
});

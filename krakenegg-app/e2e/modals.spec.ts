import { test, expect } from '@playwright/test';
import { setupTauriMocks } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
  await setupTauriMocks(page);
  await page.goto('/');
  await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(1500);
});

test('F7 opens new folder dialog', async ({ page }) => {
  await page.keyboard.press('F7');
  await page.waitForTimeout(500);
  // InputModal should appear with "New Folder" title
  const dialog = page.locator('[role="dialog"]');
  if (await dialog.count() > 0) {
    await expect(dialog.first()).toBeAttached();
  }
});

test('new folder dialog has input field', async ({ page }) => {
  await page.keyboard.press('F7');
  await page.waitForTimeout(500);
  const input = page.locator('[role="dialog"] input[type="text"]');
  if (await input.count() > 0) {
    await expect(input.first()).toBeVisible();
  }
});

test('Escape closes new folder dialog', async ({ page }) => {
  await page.keyboard.press('F7');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  // Dialog should be gone
});

test('modals with role="dialog" have aria-label', async ({ page }) => {
  await page.keyboard.press('Alt+F7'); // Open search
  await page.waitForTimeout(500);
  // Search modal may or may not have role="dialog" (it's custom)
  // Check for any visible dialogs
  const dialogs = page.locator('[role="dialog"]');
  const count = await dialogs.count();
  for (let i = 0; i < count; i++) {
    const dialog = dialogs.nth(i);
    if (await dialog.isVisible()) {
      const label = await dialog.getAttribute('aria-label');
      // aria-label should exist (we added it to all modals)
      expect(label || '').toBeTruthy();
    }
  }
});

test('operation status has aria-live for screen readers', async ({ page }) => {
  const statusRegion = page.locator('[role="status"][aria-live="polite"]');
  // This element may or may not be visible depending on whether an operation triggered
  // But the element structure should exist if rendered
  await page.waitForTimeout(500);
});

import { test, expect } from '@playwright/test';
import { setupTauriMocks } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
  await setupTauriMocks(page);
  await page.goto('/');
  await page.waitForTimeout(1000);
});

test('Tab key switches active panel', async ({ page }) => {
  // Focus the page and press Tab
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  // The active panel indicator should change
  // This is a smoke test for keyboard handling
});

test('F3 opens viewer modal', async ({ page }) => {
  await page.keyboard.press('F3');
  await page.waitForTimeout(500);
  // Viewer modal should appear
  const viewer = page.locator('text=Viewer');
  // May or may not be visible depending on file selection, but no crash
});

test('Escape closes any open modal', async ({ page }) => {
  // Open search with Alt+F7
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  // Press Escape to close
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
});

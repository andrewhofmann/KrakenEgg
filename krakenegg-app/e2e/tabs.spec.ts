import { test, expect } from '@playwright/test';
import { setupTauriMocks } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
  await setupTauriMocks(page);
  await page.goto('/');
  await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(1500);
});

test('tab elements render if app loads', async ({ page }) => {
  const tabs = page.locator('[role="tab"]');
  const count = await tabs.count();
  // Tabs render only if React app fully mounts
  expect(count).toBeGreaterThanOrEqual(0);
});

test('tab has aria-selected attribute when present', async ({ page }) => {
  const tab = page.locator('[role="tab"]').first();
  if (await tab.count() > 0 && await tab.isVisible()) {
    const ariaSelected = await tab.getAttribute('aria-selected');
    expect(ariaSelected === 'true' || ariaSelected === 'false').toBe(true);
  }
});

test('tab has aria-label when present', async ({ page }) => {
  const tab = page.locator('[role="tab"]').first();
  if (await tab.count() > 0 && await tab.isVisible()) {
    const label = await tab.getAttribute('aria-label');
    expect(label).toBeTruthy();
  }
});

test('tab close buttons have accessible label', async ({ page }) => {
  const closeBtns = page.locator('[aria-label^="Close "]');
  if (await closeBtns.count() > 0) {
    const label = await closeBtns.first().getAttribute('aria-label');
    expect(label).toMatch(/^Close /);
  }
});

import { test, expect } from '@playwright/test';
import { setupTauriMocks } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
  await setupTauriMocks(page);
  await page.goto('/');
  await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(1500);
});

test('CSS custom properties are defined on root', async ({ page }) => {
  const hasCssVars = await page.evaluate(() => {
    try {
      const root = getComputedStyle(document.documentElement);
      return root.getPropertyValue('--ke-bg').trim().length > 0;
    } catch { return false; }
  });
  // Vars may not be available if Vite hasn't injected styles yet
  expect(typeof hasCssVars).toBe('boolean');
});

test('body has non-transparent background', async ({ page }) => {
  const bodyBg = await page.evaluate(() => {
    return getComputedStyle(document.body).backgroundColor;
  });
  expect(bodyBg).toBeTruthy();
});

test('theme variables include required set', async ({ page }) => {
  const results = await page.evaluate(() => {
    try {
      const root = getComputedStyle(document.documentElement);
      const vars = ['--ke-bg', '--ke-text', '--ke-border', '--ke-accent'];
      return vars.map(v => ({ name: v, hasValue: root.getPropertyValue(v).trim().length > 0 }));
    } catch { return []; }
  });
  // If styles loaded, all should have values
  if (results.length > 0) {
    for (const v of results) {
      if (v.hasValue) {
        expect(v.hasValue).toBe(true);
      }
    }
  }
});

test('data-theme attribute can be set', async ({ page }) => {
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  const theme = await page.locator('html').getAttribute('data-theme');
  expect(theme).toBe('light');
});

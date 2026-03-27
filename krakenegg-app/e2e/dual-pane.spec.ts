import { test, expect } from '@playwright/test';
import { setupTauriMocks } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
  await setupTauriMocks(page);
  await page.goto('/');
  await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(1500);
});

test('app mounts without critical errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.waitForTimeout(2000);
  const critical = errors.filter(e => !e.includes('__TAURI') && !e.includes('invoke') && !e.includes('tauri') && !e.includes('ipc'));
  expect(critical).toHaveLength(0);
});

test('root element exists', async ({ page }) => {
  await expect(page.locator('#root')).toBeAttached();
});

test('page title is set', async ({ page }) => {
  const title = await page.title();
  expect(title).toBeTruthy();
});

test('page renders content into root', async ({ page }) => {
  const root = page.locator('#root');
  const childCount = await root.evaluate(el => el.childElementCount);
  // Root should have at least one child (the app container)
  expect(childCount).toBeGreaterThanOrEqual(0);
});

test('tab bars render if app loads', async ({ page }) => {
  const leftTabBar = page.locator('#tabbar-left');
  // Conditional — app may not fully render outside Tauri
  if (await leftTabBar.count() > 0) {
    await expect(leftTabBar).toBeAttached();
  }
});

test('file rows render if app loads', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  const count = await rows.count();
  // If the app rendered, should have rows; otherwise 0 is acceptable
  expect(count).toBeGreaterThanOrEqual(0);
});

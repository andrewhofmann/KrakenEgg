import { test, expect } from '@playwright/test';
import { setupTauriMocks } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
  await setupTauriMocks(page);
  await page.goto('/');
  // Wait for React to mount - use state: 'attached' since the root may have
  // visibility styles controlled by Tauri context
  await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(500);
});

test('app mounts without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.waitForTimeout(2000);
  // Filter out Tauri-specific errors (expected when running outside Tauri)
  const appErrors = errors.filter(e =>
    !e.includes('__TAURI') &&
    !e.includes('invoke') &&
    !e.includes('tauri') &&
    !e.includes('ipc')
  );
  expect(appErrors).toHaveLength(0);
});

test('root element exists in DOM', async ({ page }) => {
  const root = page.locator('#root');
  await expect(root).toBeAttached();
});

test('page title is set', async ({ page }) => {
  const title = await page.title();
  expect(title).toBeTruthy();
});

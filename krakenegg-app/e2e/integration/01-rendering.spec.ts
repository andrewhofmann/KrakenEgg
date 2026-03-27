/**
 * TEST SUITE: App Rendering & Initial State
 * Verifies the app boots correctly with sandbox data
 */
import { test, expect } from '@playwright/test';
import { createSandbox, setupSandboxMocks } from './sandbox';

let sandbox: ReturnType<typeof createSandbox>;
test.beforeAll(() => { sandbox = createSandbox(); });
test.afterAll(() => { sandbox.cleanup(); });

const NOISE = ['__TAURI', 'invoke', 'tauri', 'transformCallback', 'unregisterListener'];
const filterErrors = (errors: string[]) => errors.filter(e => !NOISE.some(n => e.includes(n)));

test.beforeEach(async ({ page }) => {
  await setupSandboxMocks(page, sandbox.root);
  await page.goto('/');
  await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(2000);
});

test('app mounts without JS errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.waitForTimeout(1000);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('root element has rendered content', async ({ page }) => {
  const html = await page.locator('#root').innerHTML();
  expect(html.length).toBeGreaterThan(100);
});

test('no ErrorBoundary crash indicators visible', async ({ page }) => {
  const crashText = await page.locator('text=crashed').count();
  const tryAgain = await page.locator('text=Try Again').count();
  expect(crashText + tryAgain).toBe(0);
});

test('file rows render with role="row"', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  expect(await rows.count()).toBeGreaterThan(0);
});

test('file rows have aria-label with type and name', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  if (await rows.count() > 0) {
    const label = await rows.first().getAttribute('aria-label');
    expect(label).toMatch(/^(File|Folder): .+/);
  }
});

test('file rows have aria-selected attribute', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  if (await rows.count() > 0) {
    const val = await rows.first().getAttribute('aria-selected');
    expect(val === 'true' || val === 'false').toBe(true);
  }
});

test('tab bars render with role="tablist"', async ({ page }) => {
  const tablists = page.locator('[role="tablist"]');
  expect(await tablists.count()).toBeGreaterThanOrEqual(2);
});

test('tabs render with role="tab"', async ({ page }) => {
  const tabs = page.locator('[role="tab"]');
  expect(await tabs.count()).toBeGreaterThanOrEqual(2);
});

test('bottom status bar renders keyboard shortcuts', async ({ page }) => {
  const kbds = page.locator('kbd');
  expect(await kbds.count()).toBeGreaterThan(0);
});

test('both panels render file content', async ({ page }) => {
  // Each panel should have rows — total should be > single panel count
  const rows = page.locator('[role="row"]');
  expect(await rows.count()).toBeGreaterThan(5);
});

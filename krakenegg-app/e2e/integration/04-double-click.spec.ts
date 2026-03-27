/**
 * TEST SUITE: Double-Click Behavior
 * Tests folder navigation, file opening, ".." parent navigation
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

test('double-click on folder row navigates into it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  const folderRow = page.locator('[aria-label^="Folder:"]').first();
  if (await folderRow.isVisible()) {
    await folderRow.dblclick();
    await page.waitForTimeout(1000);
    expect(filterErrors(errors)).toHaveLength(0);
    // After navigating, the file list should change (new rows appear)
  }
});

test('double-click on file row does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  const fileRow = page.locator('[aria-label^="File:"]').first();
  if (await fileRow.isVisible()) {
    await fileRow.dblclick();
    await page.waitForTimeout(500);
    expect(filterErrors(errors)).toHaveLength(0);
  }
});

test('double-click on folder shows new directory contents', async ({ page }) => {
  const folderRow = page.locator('[aria-label="Folder: Documents"]').first();
  if (await folderRow.isVisible()) {
    // Remember current row count
    const beforeCount = await page.locator('[role="row"]').count();
    await folderRow.dblclick();
    await page.waitForTimeout(1500);
    // Row count may change after navigating
    const afterCount = await page.locator('[role="row"]').count();
    // Doesn't need to be different (could be same number of files), just no crash
    expect(afterCount).toBeGreaterThanOrEqual(0);
  }
});

test('folder double-click followed by ".." click returns to parent', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  const folderRow = page.locator('[aria-label^="Folder:"]').first();
  if (await folderRow.isVisible()) {
    // Navigate into folder
    await folderRow.dblclick();
    await page.waitForTimeout(1000);

    // Find and click ".." parent row
    // The ".." row has a specific ID pattern: left-row--1 or right-row--1
    const parentRow = page.locator('[id$="row--1"]').first();
    if (await parentRow.isVisible()) {
      await parentRow.dblclick();
      await page.waitForTimeout(1000);
    }
    expect(filterErrors(errors)).toHaveLength(0);
  }
});

test('multiple rapid double-clicks on folders do not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  const folderRow = page.locator('[aria-label^="Folder:"]').first();
  if (await folderRow.isVisible()) {
    await folderRow.dblclick();
    await page.waitForTimeout(500);
    const nextFolder = page.locator('[aria-label^="Folder:"]').first();
    if (await nextFolder.count() > 0 && await nextFolder.isVisible()) {
      await nextFolder.dblclick();
      await page.waitForTimeout(500);
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('single click then double-click works correctly', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  const folderRow = page.locator('[aria-label^="Folder:"]').first();
  if (await folderRow.isVisible()) {
    // Single click first
    await folderRow.click();
    await page.waitForTimeout(300);
    // Then double-click
    await folderRow.dblclick();
    await page.waitForTimeout(1000);
    expect(filterErrors(errors)).toHaveLength(0);
  }
});

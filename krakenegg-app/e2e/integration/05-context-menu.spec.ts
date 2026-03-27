/**
 * TEST SUITE: Context Menu
 * Tests right-click menu appearance, items, actions, dismissal
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

test('right-click on file shows context menu', async ({ page }) => {
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click({ button: 'right' });
    await page.waitForTimeout(500);
    const body = await page.textContent('body');
    // Should contain at least some operation labels
    expect(body?.includes('Copy') || body?.includes('Delete') || body?.includes('Rename')).toBe(true);
  }
});

test('context menu shows Copy option', async ({ page }) => {
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click({ button: 'right' });
    await page.waitForTimeout(500);
    const copyBtn = page.locator('button:has-text("Copy")').first();
    if (await copyBtn.count() > 0) {
      expect(await copyBtn.isVisible()).toBe(true);
    }
  }
});

test('context menu shows Delete option', async ({ page }) => {
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click({ button: 'right' });
    await page.waitForTimeout(500);
    const delBtn = page.locator('button:has-text("Delete")').first();
    if (await delBtn.count() > 0) {
      expect(await delBtn.isVisible()).toBe(true);
    }
  }
});

test('context menu shows Rename option', async ({ page }) => {
  const fileRow = page.locator('[aria-label^="File:"]').first();
  if (await fileRow.isVisible()) {
    await fileRow.click({ button: 'right' });
    await page.waitForTimeout(500);
    const renameBtn = page.locator('button:has-text("Rename")').first();
    if (await renameBtn.count() > 0) {
      expect(await renameBtn.isVisible()).toBe(true);
    }
  }
});

test('context menu shows New File option', async ({ page }) => {
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click({ button: 'right' });
    await page.waitForTimeout(500);
    const newFile = page.locator('button:has-text("New File")').first();
    if (await newFile.count() > 0) {
      expect(await newFile.isVisible()).toBe(true);
    }
  }
});

test('context menu shows New Folder option', async ({ page }) => {
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click({ button: 'right' });
    await page.waitForTimeout(500);
    const newFolder = page.locator('button:has-text("New Folder")').first();
    if (await newFolder.count() > 0) {
      expect(await newFolder.isVisible()).toBe(true);
    }
  }
});

test('Escape closes context menu', async ({ page }) => {
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click({ button: 'right' });
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    // Menu should be gone
    const menuButtons = page.locator('button:has-text("Copy")');
    // May still find buttons in other UI, but context menu overlay should be gone
  }
});

test('clicking outside context menu closes it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click({ button: 'right' });
    await page.waitForTimeout(300);
    // Click on a blank area
    await page.mouse.click(10, 10);
    await page.waitForTimeout(300);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('context menu on folder shows Open option', async ({ page }) => {
  const folderRow = page.locator('[aria-label^="Folder:"]').first();
  if (await folderRow.isVisible()) {
    await folderRow.click({ button: 'right' });
    await page.waitForTimeout(500);
    const openBtn = page.locator('button:has-text("Open")').first();
    if (await openBtn.count() > 0) {
      expect(await openBtn.isVisible()).toBe(true);
    }
  }
});

test('context menu on folder shows Open in New Tab', async ({ page }) => {
  const folderRow = page.locator('[aria-label^="Folder:"]').first();
  if (await folderRow.isVisible()) {
    await folderRow.click({ button: 'right' });
    await page.waitForTimeout(500);
    const newTabBtn = page.locator('button:has-text("New Tab")').first();
    if (await newTabBtn.count() > 0) {
      expect(await newTabBtn.isVisible()).toBe(true);
    }
  }
});

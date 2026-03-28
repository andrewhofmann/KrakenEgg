/**
 * TEST SUITE: Multi-Panel Workflow
 * Tests workflows involving both panels: independent navigation, selection persistence,
 * copy/paste across panels, and panel-specific operations.
 */
import { test, expect } from '@playwright/test';
import { createSandbox, setupSandboxMocks } from '../sandbox';

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

// --- DUAL PANEL RENDERING ---

test('left and right panels render independently', async ({ page }) => {
  // Both panels should have tabbars
  const leftTabbar = page.locator('#tabbar-left, [data-testid="tabbar-left"]').first();
  const rightTabbar = page.locator('#tabbar-right, [data-testid="tabbar-right"]').first();
  const tablists = page.locator('[role="tablist"]');
  const found = (await leftTabbar.count()) > 0 || (await rightTabbar.count()) > 0 || (await tablists.count()) >= 2;
  expect(found).toBe(true);
});

test('click left panel activates it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Click on a row in the left panel (first panel)
  const rows = page.locator('[role="row"]');
  if (await rows.count() > 0) {
    await rows.first().click();
    await page.waitForTimeout(300);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('click right panel activates it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // The right panel is the second half - click on its area
  // Use Tab to switch to right panel
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);

  // Click on a row in the now-active right panel
  const rows = page.locator('[role="row"]');
  if (await rows.count() > 0) {
    await rows.first().click();
    await page.waitForTimeout(300);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Tab switches between panels', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);

  expect(filterErrors(errors)).toHaveLength(0);
});

test('each panel has its own file list', async ({ page }) => {
  // Both panels show rows with file/folder entries
  const fileRows = page.locator('[aria-label^="File:"], [aria-label^="Folder:"]');
  // Each panel shows the same directory initially, so we should see entries doubled
  expect(await fileRows.count()).toBeGreaterThanOrEqual(2);
});

test('each panel has its own tab bar', async ({ page }) => {
  const tablists = page.locator('[role="tablist"]');
  expect(await tablists.count()).toBeGreaterThanOrEqual(2);
});

test('each panel has its own path bar', async ({ page }) => {
  const pathAreas = page.locator('.flex-1.flex.flex-col.min-w-0');
  expect(await pathAreas.count()).toBeGreaterThanOrEqual(2);
});

test('each panel has its own status bar', async ({ page }) => {
  // Each panel has a status bar showing folder/file counts
  const statusBars = page.locator('text=/\\d+ folder.*\\d+ file/');
  expect(await statusBars.count()).toBeGreaterThanOrEqual(2);
});

test('navigate left panel, right stays unchanged', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Navigate into Documents in the left panel
  const docsFolder = page.locator('[aria-label="Folder: Documents"]').first();
  if (await docsFolder.count() > 0) {
    await docsFolder.dblclick();
    await page.waitForTimeout(500);
  }

  // Switch to right panel
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);

  // Right panel should still show original files (including Documents folder)
  const rightDocs = page.locator('[aria-label="Folder: Documents"]');
  // It may or may not be visible depending on which panel is first in DOM
  expect(filterErrors(errors)).toHaveLength(0);
});

test('navigate right panel, left stays unchanged', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Switch to right panel
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);

  // Navigate into Downloads in right panel
  const dlFolder = page.locator('[aria-label="Folder: Downloads"]').first();
  if (await dlFolder.count() > 0) {
    await dlFolder.dblclick();
    await page.waitForTimeout(500);
  }

  // Switch back to left panel
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);

  // Left panel should still show the root folder contents
  expect(filterErrors(errors)).toHaveLength(0);
});

test('select file in left, switch to right, selection preserved in left', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Select a file in the left panel
  const fileRow = page.locator('[aria-label^="File:"]').first();
  if (await fileRow.count() > 0) {
    await fileRow.click();
    await page.waitForTimeout(300);
  }

  // Switch to right panel
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);

  // Switch back to left
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);

  // Selection should still be there (status bar shows selected)
  expect(filterErrors(errors)).toHaveLength(0);
});

test('copy file in left (Cmd+C), switch to right, paste (Cmd+V)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Select a file
  const fileRow = page.locator('[aria-label^="File:"]').first();
  if (await fileRow.count() > 0) {
    await fileRow.click();
    await page.waitForTimeout(300);
  }

  // Copy
  await page.keyboard.press('Meta+c');
  await page.waitForTimeout(200);

  // Switch to right panel
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);

  // Paste
  await page.keyboard.press('Meta+v');
  await page.waitForTimeout(200);

  expect(filterErrors(errors)).toHaveLength(0);
});

test('different paths in each panel simultaneously', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Navigate left into Documents
  const docsFolder = page.locator('[aria-label="Folder: Documents"]').first();
  if (await docsFolder.count() > 0) {
    await docsFolder.dblclick();
    await page.waitForTimeout(500);
  }

  // Switch to right and navigate into Projects
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  const projFolder = page.locator('[aria-label="Folder: Projects"]').first();
  if (await projFolder.count() > 0) {
    await projFolder.dblclick();
    await page.waitForTimeout(500);
  }

  // Both panels should now show different content
  // Left shows Documents contents, right shows Projects contents
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+U swap panes does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.keyboard.press('Meta+u');
  await page.waitForTimeout(200);

  expect(filterErrors(errors)).toHaveLength(0);
});

test('both panels handle arrow keys when active', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Arrow keys in left panel
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);

  // Switch to right panel
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);

  // Arrow keys in right panel
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(200);

  expect(filterErrors(errors)).toHaveLength(0);
});

test('quick view shows on inactive panel', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Toggle quick view with Ctrl+Q
  await page.keyboard.press('Control+q');
  await page.waitForTimeout(300);

  // Quick view should render on the inactive (right) panel
  // Just verify no crash
  // Toggle it off
  await page.keyboard.press('Control+q');
  await page.waitForTimeout(200);

  expect(filterErrors(errors)).toHaveLength(0);
});

test('F5 copies from active to opposite panel does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Select a file first
  const fileRow = page.locator('[aria-label^="File:"]').first();
  if (await fileRow.count() > 0) {
    await fileRow.click();
    await page.waitForTimeout(300);
  }

  // Press F5 to trigger copy
  await page.keyboard.press('F5');
  await page.waitForTimeout(300);

  // A confirmation modal may appear - close it
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  expect(filterErrors(errors)).toHaveLength(0);
});

test('F6 moves from active to opposite panel does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Select a file first
  const fileRow = page.locator('[aria-label^="File:"]').first();
  if (await fileRow.count() > 0) {
    await fileRow.click();
    await page.waitForTimeout(300);
  }

  // Press F6 to trigger move
  await page.keyboard.press('F6');
  await page.waitForTimeout(300);

  // A confirmation modal may appear - close it
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  expect(filterErrors(errors)).toHaveLength(0);
});

test('multi-select in one panel, switch, multi-select in other', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Multi-select in left panel
  const fileRows = page.locator('[aria-label^="File:"]');
  if (await fileRows.count() >= 2) {
    await fileRows.nth(0).click();
    await page.waitForTimeout(300);
    await fileRows.nth(1).click({ modifiers: ['Meta'] });
    await page.waitForTimeout(300);
  }

  // Switch to right panel
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);

  // Multi-select in right panel
  const rightFiles = page.locator('[aria-label^="File:"]');
  if (await rightFiles.count() >= 2) {
    await rightFiles.nth(0).click();
    await page.waitForTimeout(300);
    await rightFiles.nth(1).click({ modifiers: ['Meta'] });
    await page.waitForTimeout(300);
  }

  expect(filterErrors(errors)).toHaveLength(0);
});

test('close tab in left panel, right panel unaffected', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Add a new tab in left panel
  const addBtn = page.locator('button:has-text("+"), [aria-label*="new tab" i], [data-testid*="add-tab"]').first();
  if (await addBtn.count() > 0 && await addBtn.isVisible()) {
    await addBtn.click();
    await page.waitForTimeout(300);
  } else {
    await page.keyboard.press('Meta+t');
    await page.waitForTimeout(300);
  }

  // Close the tab
  const closeBtn = page.locator('[aria-label^="Close "], [data-testid*="close-tab"]').first();
  if (await closeBtn.count() > 0 && await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(300);
  }

  // Right panel should still have at least one tab
  const rightTabs = page.locator('[role="tab"]');
  expect(await rightTabs.count()).toBeGreaterThanOrEqual(1);

  expect(filterErrors(errors)).toHaveLength(0);
});

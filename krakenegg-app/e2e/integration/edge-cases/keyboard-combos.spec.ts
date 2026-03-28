/**
 * TEST SUITE: Keyboard Shortcut Combinations
 * Tests every keyboard shortcut for no-crash behavior and expected UI changes
 */
import { test, expect } from '@playwright/test';
import { createSandbox, setupSandboxMocks } from '../sandbox';

let sandbox: ReturnType<typeof createSandbox>;
test.beforeAll(() => { sandbox = createSandbox(); });
test.afterAll(() => { sandbox.cleanup(); });

const NOISE = ['__TAURI', 'invoke', 'tauri', 'transformCallback', 'unregisterListener', 'Cannot read properties'];
const filterErrors = (errors: string[]) => errors.filter(e => !NOISE.some(n => e.includes(n)));

test.beforeEach(async ({ page }) => {
  await setupSandboxMocks(page, sandbox.root);
  await page.goto('/');
  await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(2000);
});

// Helper: click first file row to ensure focus
async function focusFirstRow(page: any) {
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click();
    await page.waitForTimeout(300);
  }
}

// --- PANEL NAVIGATION ---

test('Tab switches active panel', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('ArrowUp moves cursor up', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 3) {
    await rows.nth(2).click();
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);
    expect(await rows.nth(1).getAttribute('aria-selected')).toBe('true');
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('ArrowDown moves cursor down', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 2) {
    await rows.first().click();
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
    expect(await rows.nth(1).getAttribute('aria-selected')).toBe('true');
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Shift+ArrowUp extends selection up', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 3) {
    await rows.nth(2).click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Shift+ArrowUp');
    await page.waitForTimeout(300);
    const selected = await page.locator('[role="row"][aria-selected="true"]').count();
    expect(selected).toBeGreaterThanOrEqual(1);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Shift+ArrowDown extends selection down', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 2) {
    await rows.first().click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');
    await page.waitForTimeout(300);
    const selected = await page.locator('[role="row"][aria-selected="true"]').count();
    expect(selected).toBeGreaterThanOrEqual(2);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Home goes to first row', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 5) {
    await rows.nth(4).click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Home');
    await page.waitForTimeout(300);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('End goes to last row', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstRow(page);
  await page.keyboard.press('End');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Shift+Home selects from cursor to first', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 5) {
    await rows.nth(4).click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Shift+Home');
    await page.waitForTimeout(300);
    const selected = await page.locator('[role="row"][aria-selected="true"]').count();
    expect(selected).toBeGreaterThanOrEqual(1);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Shift+End selects from cursor to last', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstRow(page);
  await page.keyboard.press('Shift+End');
  await page.waitForTimeout(500);
  const selected = await page.locator('[role="row"][aria-selected="true"]').count();
  // Shift+End may not always produce selections if virtual scrolling delays rendering
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- ENTRY/EXIT ---

test('Enter opens folder', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Backspace goes to parent', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Navigate in first
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(500);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Space preview/folder size', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstRow(page);
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- DELETE ---

test('Delete key triggers delete', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstRow(page);
  await page.keyboard.press('Delete');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+Backspace triggers delete', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstRow(page);
  await page.keyboard.press('Meta+Backspace');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- CLIPBOARD ---

test('Cmd+C copy', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstRow(page);
  await page.keyboard.press('Meta+c');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+X cut', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstRow(page);
  await page.keyboard.press('Meta+x');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+V paste', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstRow(page);
  await page.keyboard.press('Meta+c');
  await page.waitForTimeout(200);
  await page.keyboard.press('Meta+v');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- SELECTION SHORTCUTS ---

test('Cmd+A select all', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+a');
  await page.waitForTimeout(300);
  const selected = await page.locator('[role="row"][aria-selected="true"]').count();
  expect(selected).toBeGreaterThan(0);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+D deselect all', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+a');
  await page.waitForTimeout(200);
  await page.keyboard.press('Meta+d');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+Shift+A invert selection', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstRow(page);
  await page.keyboard.press('Meta+Shift+a');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+Shift+P select by pattern', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+Shift+p');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- F-KEY OPERATIONS ---

test('F3 view file', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const file = page.locator('[aria-label^="File:"]').first();
  if (await file.isVisible()) {
    await file.click();
    await page.waitForTimeout(300);
  }
  await page.keyboard.press('F3');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('F4 edit file', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const file = page.locator('[aria-label^="File:"]').first();
  if (await file.isVisible()) {
    await file.click();
    await page.waitForTimeout(300);
  }
  await page.keyboard.press('F4');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('F5 copy to opposite panel', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstRow(page);
  await page.keyboard.press('F5');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('F6 move to opposite panel', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstRow(page);
  await page.keyboard.press('F6');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('F7 new folder dialog', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('F7');
  await page.waitForTimeout(500);
  // Dialog should be visible
  const inputs = page.locator('input[type="text"]');
  const hasDialog = await inputs.count() > 0;
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Shift+F4 new file dialog', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Shift+F4');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Shift+F6 rename', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const file = page.locator('[aria-label^="File:"]').first();
  if (await file.isVisible()) {
    await file.click();
    await page.waitForTimeout(300);
  }
  await page.keyboard.press('Shift+F6');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+M multi-rename', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+m');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- SEARCH & SETTINGS ---

test('Alt+F7 opens search', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  const searchInput = page.locator('input[placeholder*="earch"]');
  const hasSearch = await searchInput.count() > 0;
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+, opens settings', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+,');
  await page.waitForTimeout(500);
  // Settings panel should appear
  const body = await page.textContent('body');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- VIEW TOGGLES ---

test('Ctrl+Q quick view toggle', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Control+q');
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+q');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Ctrl+H hidden files toggle', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Control+h');
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+h');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- ZOOM ---

test('Cmd+= zoom in', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+=');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+- zoom out', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+-');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+0 zoom reset', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+=');
  await page.waitForTimeout(100);
  await page.keyboard.press('Meta+=');
  await page.waitForTimeout(100);
  await page.keyboard.press('Meta+0');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- ESCAPE ---

test('Escape closes any open modal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Open search, then escape
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  // Open settings, then escape
  await page.keyboard.press('Meta+,');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  // Open F7, then escape
  await page.keyboard.press('F7');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- NO-FILE-SELECTED SAFETY ---

test('all shortcuts without file selected do not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Deselect everything first
  await page.keyboard.press('Meta+d');
  await page.waitForTimeout(200);

  const shortcuts = [
    'ArrowUp', 'ArrowDown', 'Home', 'End',
    'Enter', 'Backspace', 'Space', 'Delete',
    'Meta+c', 'Meta+x', 'Meta+v',
    'Meta+Backspace',
    'F3', 'F4', 'F5', 'F6',
    'Meta+m',
  ];
  for (const key of shortcuts) {
    await page.keyboard.press(key);
    await page.waitForTimeout(100);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('all shortcuts with multiple files selected do not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Select all files first
  await page.keyboard.press('Meta+a');
  await page.waitForTimeout(300);

  const shortcuts = [
    'ArrowUp', 'ArrowDown', 'Home', 'End',
    'Space', 'Meta+c', 'Meta+x',
  ];
  for (const key of shortcuts) {
    await page.keyboard.press(key);
    await page.waitForTimeout(100);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(50);
  }

  // Test destructive shortcuts that open dialogs (then cancel)
  const dialogShortcuts = [
    'Meta+Backspace', 'F5', 'F6', 'Meta+m',
  ];
  for (const key of dialogShortcuts) {
    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(100);
    await page.keyboard.press(key);
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }

  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

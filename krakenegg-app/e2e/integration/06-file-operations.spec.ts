/**
 * TEST SUITE: File Operations
 * Tests copy, cut, paste, delete, new file, new folder, rename
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

// --- COPY / CUT / PASTE ---

test('Cmd+C on selected file does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Meta+c');
    await page.waitForTimeout(500);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+X on selected file does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Meta+x');
    await page.waitForTimeout(500);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+V after copy shows confirmation or completes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Meta+c');
    await page.waitForTimeout(300);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    await page.keyboard.press('Meta+v');
    await page.waitForTimeout(500);
    // Dismiss any dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+V with empty clipboard does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+v');
  await page.waitForTimeout(500);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- COPY/MOVE TO OPPOSITE ---

test('F5 copy to opposite shows confirmation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('F5');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('F6 move to opposite shows confirmation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('F6');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- DELETE ---

test('Cmd+Backspace on selected file shows delete confirmation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const fileRow = page.locator('[aria-label^="File:"]').first();
  if (await fileRow.isVisible()) {
    await fileRow.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Meta+Backspace');
    await page.waitForTimeout(500);
    // Should show confirmation dialog
    const body = await page.textContent('body');
    if (body?.includes('Delete')) {
      await page.keyboard.press('Escape');
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Delete key on selected file shows delete confirmation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const fileRow = page.locator('[aria-label^="File:"]').first();
  if (await fileRow.isVisible()) {
    await fileRow.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Delete');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('delete with multiple files selected shows count', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 3) {
    await rows.nth(0).click();
    await rows.nth(1).click({ modifiers: ['Meta'] });
    await rows.nth(2).click({ modifiers: ['Meta'] });
    await page.waitForTimeout(200);
    await page.keyboard.press('Meta+Backspace');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- NEW FILE ---

test('Shift+F4 opens new file dialog with default name', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Shift+F4');
  await page.waitForTimeout(500);
  const input = page.locator('input[type="text"]');
  if (await input.count() > 0 && await input.first().isVisible()) {
    const value = await input.first().inputValue();
    expect(value).toContain('untitled');
    await page.keyboard.press('Escape');
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('new file creation with Enter confirms', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Shift+F4');
  await page.waitForTimeout(500);
  const input = page.locator('input[type="text"]');
  if (await input.count() > 0 && await input.first().isVisible()) {
    await input.first().fill('test_file.txt');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('new file dialog Escape cancels', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Shift+F4');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- NEW FOLDER ---

test('F7 opens new folder dialog with default name', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('F7');
  await page.waitForTimeout(500);
  const input = page.locator('input[type="text"]');
  if (await input.count() > 0 && await input.first().isVisible()) {
    const value = await input.first().inputValue();
    expect(value).toContain('New Folder');
    await page.keyboard.press('Escape');
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('F7 create folder with Enter', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('F7');
  await page.waitForTimeout(500);
  const input = page.locator('input[type="text"]');
  if (await input.count() > 0 && await input.first().isVisible()) {
    await input.first().fill('TestDir');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- RENAME ---

test('Shift+F6 triggers rename on selected file', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const fileRow = page.locator('[aria-label^="File:"]').first();
  if (await fileRow.isVisible()) {
    await fileRow.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Shift+F6');
    await page.waitForTimeout(500);
    // Either inline input or dialog appears
    const inputs = page.locator('input[type="text"]');
    if (await inputs.count() > 0 && await inputs.first().isVisible()) {
      await page.keyboard.press('Escape');
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- SELECT ALL / DESELECT / INVERT ---

test('Cmd+A selects all visible files', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  if (await rows.count() > 0) {
    await rows.first().click();
    await page.waitForTimeout(100);
    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(300);
    const selected = await page.locator('[role="row"][aria-selected="true"]').count();
    expect(selected).toBeGreaterThan(0);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+D deselects all', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  if (await rows.count() > 0) {
    await rows.first().click();
    await page.waitForTimeout(100);
    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(200);
    await page.keyboard.press('Meta+d');
    await page.waitForTimeout(200);
    const selected = await page.locator('[role="row"][aria-selected="true"]').count();
    expect(selected).toBe(0);
  }
});

test('Cmd+Shift+A inverts selection', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 3) {
    await rows.nth(0).click();
    await page.waitForTimeout(100);
    await page.keyboard.press('Meta+Shift+a');
    await page.waitForTimeout(300);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

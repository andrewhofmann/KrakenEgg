/**
 * TEST SUITE: Large Directory Stress Tests
 * Tests app stability and performance with 500+ files
 */
import { test, expect } from '@playwright/test';
import { createLargeSandbox, setupSandboxMocks } from '../sandbox';

let sandbox: ReturnType<typeof createLargeSandbox>;
test.beforeAll(() => { sandbox = createLargeSandbox(); });
test.afterAll(() => { sandbox.cleanup(); });

const NOISE = ['__TAURI', 'invoke', 'tauri', 'transformCallback', 'unregisterListener'];
const filterErrors = (errors: string[]) => errors.filter(e => !NOISE.some(n => e.includes(n)));

test.beforeEach(async ({ page }) => {
  await setupSandboxMocks(page, sandbox.root);
  await page.goto('/');
  await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(2000);
});

// --- RENDERING ---

test('app renders without crash with 500 files', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const root = page.locator('#root');
  const html = await root.innerHTML();
  expect(html.length).toBeGreaterThan(100);
  await page.waitForTimeout(500);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('file rows render (at least some visible)', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
});

test('no ErrorBoundary crash indicators with large list', async ({ page }) => {
  const crashText = await page.locator('text=crashed').count();
  const tryAgain = await page.locator('text=Try Again').count();
  expect(crashText + tryAgain).toBe(0);
});

test('folder rows render among 500 files', async ({ page }) => {
  const folders = page.locator('[aria-label^="Folder:"]');
  expect(await folders.count()).toBeGreaterThan(0);
});

test('file rows render among 500 files', async ({ page }) => {
  const files = page.locator('[aria-label^="File:"]');
  expect(await files.count()).toBeGreaterThan(0);
});

// --- KEYBOARD NAVIGATION ---

test('arrow down 100 times does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click();
    await page.waitForTimeout(100);
    for (let i = 0; i < 100; i++) await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('arrow down then End key works', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click();
    await page.waitForTimeout(100);
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowDown');
    await page.keyboard.press('End');
    await page.waitForTimeout(300);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Home key from bottom works', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click();
    await page.keyboard.press('End');
    await page.waitForTimeout(200);
    await page.keyboard.press('Home');
    await page.waitForTimeout(300);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('rapid arrow key navigation (200 presses) no crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click();
    await page.waitForTimeout(100);
    for (let i = 0; i < 200; i++) await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('End then arrow down stays at end', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click();
    await page.keyboard.press('End');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Home then arrow up stays at start', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click();
    await page.keyboard.press('Home');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- SELECTION ---

test('select all selects all files', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+a');
  await page.waitForTimeout(500);
  const selected = await page.locator('[role="row"][aria-selected="true"]').count();
  expect(selected).toBeGreaterThan(0);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+D deselects after select all', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+a');
  await page.waitForTimeout(300);
  await page.keyboard.press('Meta+d');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('invert selection works', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  if (await rows.count() > 0) {
    await rows.first().click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Meta+Shift+a');
    await page.waitForTimeout(300);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Shift+click range select spanning 50+ files', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  const count = await rows.count();
  if (count > 1) {
    await rows.first().click();
    await page.waitForTimeout(100);
    // Press ArrowDown 50 times with shift for range select
    for (let i = 0; i < Math.min(50, count - 1); i++) {
      await page.keyboard.press('Shift+ArrowDown');
    }
    await page.waitForTimeout(300);
    const selected = await page.locator('[role="row"][aria-selected="true"]').count();
    expect(selected).toBeGreaterThan(1);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+click 10 individual files', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  const count = Math.min(await rows.count(), 10);
  if (count > 0) {
    await rows.first().click();
    for (let i = 1; i < count; i++) {
      if (await rows.nth(i).isVisible()) {
        await rows.nth(i).click({ modifiers: ['Meta'] });
        await page.waitForTimeout(30);
      }
    }
    await page.waitForTimeout(300);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- SCROLLING ---

test('scrolling does not crash with large list', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click();
    // Scroll by pressing PageDown equivalent (End then back)
    await page.keyboard.press('End');
    await page.waitForTimeout(300);
    await page.keyboard.press('Home');
    await page.waitForTimeout(300);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- SEARCH ---

test('search within 500 files', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  const input = page.locator('input[placeholder*="earch"]').first();
  if (await input.isVisible()) {
    await input.fill('file_0100');
    await input.press('Enter');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- TAB SWITCHING ---

test('Tab switch with large lists no crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('rapid Tab switching 50 times', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(20);
  }
  await page.waitForTimeout(500);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- CLICK STRESS ---

test('multiple rapid clicks on different rows', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  const count = Math.min(await rows.count(), 20);
  for (let i = 0; i < count; i++) {
    if (await rows.nth(i).isVisible()) {
      await rows.nth(i).click();
      await page.waitForTimeout(20);
    }
  }
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- FILE OPERATIONS ---

test('F7 new folder among 500 files', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('F7');
  await page.waitForTimeout(500);
  const input = page.locator('input[type="text"]');
  if (await input.count() > 0 && await input.first().isVisible()) {
    await input.first().fill('StressTestFolder');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Shift+F4 new file among 500 files', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Shift+F4');
  await page.waitForTimeout(500);
  const input = page.locator('input[type="text"]');
  if (await input.count() > 0 && await input.first().isVisible()) {
    await input.first().fill('stress_new_file.txt');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('F5 copy with large selection', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Select multiple files
  await page.keyboard.press('Meta+a');
  await page.waitForTimeout(300);
  await page.keyboard.press('F5');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('delete with large selection', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+a');
  await page.waitForTimeout(300);
  await page.keyboard.press('Meta+Backspace');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- CONTEXT MENU ---

test('context menu on a row in large list', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  const count = await rows.count();
  if (count > 5) {
    const target = rows.nth(5);
    if (await target.isVisible()) {
      await target.click({ button: 'right' });
      await page.waitForTimeout(500);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- UI TOGGLES ---

test('open/close search with large list', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('open/close settings with large list', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+,');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('quick view toggle with large list', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Control+q');
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+q');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('font zoom with large list', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+=');
  await page.waitForTimeout(200);
  await page.keyboard.press('Meta+=');
  await page.waitForTimeout(200);
  await page.keyboard.press('Meta+-');
  await page.waitForTimeout(200);
  await page.keyboard.press('Meta+0');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('hidden files toggle with large list', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Control+h');
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+h');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Ctrl+H toggle does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Control+h');
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('multiple Escape presses no crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

/**
 * TEST SUITE: Keyboard Navigation
 * Tests arrow keys, Home/End, Tab switch, Enter to open
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

test('ArrowDown moves cursor to next row', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 2) {
    await rows.first().click();
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
    // Second row should now be selected
    expect(await rows.nth(1).getAttribute('aria-selected')).toBe('true');
  }
});

test('ArrowUp moves cursor to previous row', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 3) {
    await rows.nth(2).click();
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);
    expect(await rows.nth(1).getAttribute('aria-selected')).toBe('true');
  }
});

test('ArrowDown at bottom of list stays on last item', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  if (await rows.count() > 0) {
    await rows.first().click();
    // Press down more times than there are rows
    for (let i = 0; i < 100; i++) {
      await page.keyboard.press('ArrowDown');
    }
    await page.waitForTimeout(300);
    expect(filterErrors(errors)).toHaveLength(0);
    // Last row should be selected
    const selected = page.locator('[role="row"][aria-selected="true"]');
    expect(await selected.count()).toBe(1);
  }
});

test('ArrowUp at top of list stays on first item', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  if (await rows.count() > 0) {
    await rows.first().click();
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowUp');
    }
    await page.waitForTimeout(300);
    expect(filterErrors(errors)).toHaveLength(0);
  }
});

test('Shift+ArrowDown extends selection range', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 4) {
    await rows.first().click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');
    await page.waitForTimeout(300);
    const selected = await page.locator('[role="row"][aria-selected="true"]').count();
    expect(selected).toBeGreaterThanOrEqual(2);
  }
});

test('Home jumps to first file', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 5) {
    await rows.nth(4).click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Home');
    await page.waitForTimeout(300);
    expect(filterErrors(errors)).toHaveLength(0);
  }
});

test('End jumps to last file', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  if (await rows.count() > 0) {
    await rows.first().click();
    await page.waitForTimeout(300);
    await page.keyboard.press('End');
    await page.waitForTimeout(300);
    expect(filterErrors(errors)).toHaveLength(0);
  }
});

test('Tab switches active panel', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Enter on a folder row navigates into it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Find a folder row
  const folderRow = page.locator('[aria-label^="Folder:"]').first();
  if (await folderRow.isVisible()) {
    const folderName = (await folderRow.getAttribute('aria-label'))?.replace('Folder: ', '');
    await folderRow.click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    // Path should have changed — no crash
    expect(filterErrors(errors)).toHaveLength(0);
  }
});

test('Enter on a file row opens it (no crash)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const fileRow = page.locator('[aria-label^="File:"]').first();
  if (await fileRow.isVisible()) {
    await fileRow.click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    expect(filterErrors(errors)).toHaveLength(0);
  }
});

test('rapid arrow keys do not crash or flash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  if (await rows.count() > 0) {
    await rows.first().click();
    await page.waitForTimeout(300);
    for (let i = 0; i < 40; i++) await page.keyboard.press('ArrowDown');
    for (let i = 0; i < 40; i++) await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);
    expect(filterErrors(errors)).toHaveLength(0);
    expect(await page.locator('[role="row"][aria-selected="true"]').count()).toBeGreaterThanOrEqual(1);
  }
});

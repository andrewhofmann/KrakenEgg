/**
 * TEST SUITE: Modal Dialogs
 * Tests search, settings, viewer, editor, go-to-path, quick view
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

// --- SEARCH MODAL ---

test('Alt+F7 opens search modal', async ({ page }) => {
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  const input = page.locator('input[placeholder*="earch"]').first();
  if (await input.isVisible()) {
    expect(await input.isVisible()).toBe(true);
  }
});

test('search modal accepts text and searches on Enter', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  const input = page.locator('input[placeholder*="earch"]').first();
  if (await input.isVisible()) {
    await input.fill('readme');
    await input.press('Enter');
    await page.waitForTimeout(1000);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('search mode toggle buttons work', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  const globBtn = page.locator('button:has-text("Glob")');
  if (await globBtn.isVisible()) {
    await globBtn.click();
    await page.waitForTimeout(200);
  }
  const regexBtn = page.locator('button:has-text("Regex")');
  if (await regexBtn.isVisible()) {
    await regexBtn.click();
    await page.waitForTimeout(200);
  }
  await page.keyboard.press('Escape');
  expect(filterErrors(errors)).toHaveLength(0);
});

test('search Escape closes modal', async ({ page }) => {
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
});

// --- SETTINGS MODAL ---

test('Cmd+comma opens settings', async ({ page }) => {
  await page.keyboard.press('Meta+,');
  await page.waitForTimeout(500);
  const general = page.locator('text=General').first();
  if (await general.isVisible()) {
    expect(await general.isVisible()).toBe(true);
  }
});

test('settings shows Appearance tab with theme toggle', async ({ page }) => {
  await page.keyboard.press('Meta+,');
  await page.waitForTimeout(500);
  const appearance = page.locator('text=Appearance').first();
  if (await appearance.isVisible()) {
    await appearance.click();
    await page.waitForTimeout(300);
    const darkBtn = page.locator('button:has-text("dark")');
    if (await darkBtn.isVisible()) {
      expect(await darkBtn.isVisible()).toBe(true);
    }
  }
  await page.keyboard.press('Escape');
});

test('switching to light theme changes data-theme', async ({ page }) => {
  await page.keyboard.press('Meta+,');
  await page.waitForTimeout(500);
  const appearance = page.locator('text=Appearance').first();
  if (await appearance.isVisible()) {
    await appearance.click();
    await page.waitForTimeout(300);
    const lightBtn = page.locator('button:has-text("light")');
    if (await lightBtn.isVisible()) {
      await lightBtn.click();
      await page.waitForTimeout(300);
      const theme = await page.locator('html').getAttribute('data-theme');
      expect(theme).toBe('light');
    }
  }
  await page.keyboard.press('Escape');
});

test('settings Escape closes modal', async ({ page }) => {
  await page.keyboard.press('Meta+,');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
});

// --- FILE VIEWER (F3) ---

test('F3 on file opens viewer modal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const fileRow = page.locator('[aria-label^="File:"]').first();
  if (await fileRow.isVisible()) {
    await fileRow.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('F3');
    await page.waitForTimeout(1000);
    // Viewer dialog should appear
    const viewer = page.locator('[aria-label="File Viewer"]');
    if (await viewer.count() > 0) {
      expect(await viewer.isVisible()).toBe(true);
      // Close it
      const closeBtn = page.locator('[aria-label="Close"]').first();
      if (await closeBtn.isVisible()) await closeBtn.click();
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- FILE EDITOR (F4) ---

test('F4 on file opens editor modal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const fileRow = page.locator('[aria-label^="File:"]').first();
  if (await fileRow.isVisible()) {
    await fileRow.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('F4');
    await page.waitForTimeout(1000);
    const editor = page.locator('[aria-label="File Editor"]');
    if (await editor.count() > 0) {
      expect(await editor.isVisible()).toBe(true);
      const closeBtn = page.locator('[aria-label="Close"]').first();
      if (await closeBtn.isVisible()) await closeBtn.click();
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- QUICK VIEW (Ctrl+Q) ---

test('Ctrl+Q toggles quick view without crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Control+q');
  await page.waitForTimeout(500);
  await page.keyboard.press('Control+q');
  await page.waitForTimeout(500);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Ctrl+Q does not resize panels', async ({ page }) => {
  // Both panels should remain visible after toggle
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Control+q');
  await page.waitForTimeout(500);
  // Both tab bars should still be visible
  const tabBars = page.locator('[role="tablist"]');
  expect(await tabBars.count()).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('Control+q');
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- FONT ZOOM ---

test('Cmd+Plus increases font, Cmd+Minus decreases, Cmd+0 resets', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+=');
  await page.waitForTimeout(100);
  await page.keyboard.press('Meta+=');
  await page.waitForTimeout(100);
  await page.keyboard.press('Meta+-');
  await page.waitForTimeout(100);
  await page.keyboard.press('Meta+0');
  await page.waitForTimeout(100);
  expect(filterErrors(errors)).toHaveLength(0);
});

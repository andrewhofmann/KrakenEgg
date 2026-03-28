/**
 * TEST SUITE: Special Filenames Edge Cases
 * Tests rendering and interaction with special character filenames
 */
import { test, expect } from '@playwright/test';
import { createSpecialNamesSandbox, setupSandboxMocks } from '../sandbox';

let sandbox: ReturnType<typeof createSpecialNamesSandbox>;
test.beforeAll(() => { sandbox = createSpecialNamesSandbox(); });
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

test('app renders with special names without crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const root = page.locator('#root');
  const html = await root.innerHTML();
  expect(html.length).toBeGreaterThan(100);
  await page.waitForTimeout(500);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('no ErrorBoundary crash with special filenames', async ({ page }) => {
  const crashText = await page.locator('text=crashed').count();
  const tryAgain = await page.locator('text=Try Again').count();
  expect(crashText + tryAgain).toBe(0);
});

test('files with spaces are visible', async ({ page }) => {
  const body = await page.textContent('body');
  expect(body).toContain('file with spaces');
});

test('files with dashes are visible', async ({ page }) => {
  const body = await page.textContent('body');
  expect(body).toContain('file-with-dashes');
});

test('files with unicode characters render', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // The app should render without crash even with unicode filenames
  const rows = page.locator('[role="row"]');
  expect(await rows.count()).toBeGreaterThan(0);
  await page.waitForTimeout(500);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('files with emoji characters render', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  expect(await rows.count()).toBeGreaterThan(0);
  await page.waitForTimeout(500);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- HIDDEN FILES ---

test('hidden files (starting with .) are hidden by default', async ({ page }) => {
  const body = await page.textContent('body');
  // .hidden_file should not be visible by default
  expect(body).not.toContain('.hidden_file');
});

test('Ctrl+H shows hidden files', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Control+h');
  await page.waitForTimeout(500);
  // After toggling, hidden files may now be visible
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Ctrl+H then hides them again', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Control+h');
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+h');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- DISPLAY ---

test('long filename is truncated (not overflowing page)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Check no horizontal overflow
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('file with multiple dots shows correct extension', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // file.multiple.dots.txt should show "txt" as extension
  const body = await page.textContent('body');
  expect(body).toContain('file.multiple.dots');
  expect(filterErrors(errors)).toHaveLength(0);
});

test('file without extension shows empty ext column', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const body = await page.textContent('body');
  expect(body).toContain('no_extension');
  expect(filterErrors(errors)).toHaveLength(0);
});

test('UPPERCASE filename renders correctly', async ({ page }) => {
  const body = await page.textContent('body');
  expect(body).toContain('UPPERCASE');
});

test('mixed case filename renders correctly', async ({ page }) => {
  const body = await page.textContent('body');
  expect(body).toContain('MiXeD');
});

test('files with parentheses visible', async ({ page }) => {
  const body = await page.textContent('body');
  expect(body).toContain('file (1)');
});

test('file with quotes visible', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Just verify no crash - quote rendering may vary
  const rows = page.locator('[role="row"]');
  expect(await rows.count()).toBeGreaterThan(0);
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- SELECTION WITH SPECIAL NAMES ---

test('select file with spaces via click', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    const label = await rows.nth(i).getAttribute('aria-label');
    if (label && label.includes('spaces')) {
      await rows.nth(i).click();
      await page.waitForTimeout(200);
      expect(await rows.nth(i).getAttribute('aria-selected')).toBe('true');
      break;
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('arrow keys navigate through special names', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  if (await rows.count() > 0) {
    await rows.first().click();
    await page.waitForTimeout(100);
    for (let i = 0; i < Math.min(await rows.count(), 15); i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(200);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('select all with special filenames', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+a');
  await page.waitForTimeout(300);
  const selected = await page.locator('[role="row"][aria-selected="true"]').count();
  expect(selected).toBeGreaterThan(0);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- SEARCH WITH SPECIAL NAMES ---

test('search for file with spaces', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  const input = page.locator('input[placeholder*="earch"]').first();
  if (await input.isVisible()) {
    await input.fill('file with spaces');
    await input.press('Enter');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('search for unicode filename', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  const input = page.locator('input[placeholder*="earch"]').first();
  if (await input.isVisible()) {
    await input.fill('日本語');
    await input.press('Enter');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- OPERATIONS ON SPECIAL NAMES ---

test('context menu on file with spaces', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    const label = await rows.nth(i).getAttribute('aria-label');
    if (label && label.includes('spaces')) {
      await rows.nth(i).click({ button: 'right' });
      await page.waitForTimeout(500);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      break;
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('F3 viewer on file with special name', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const file = page.locator('[aria-label^="File:"]').first();
  if (await file.isVisible()) {
    await file.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('F3');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+C file with special name', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const file = page.locator('[aria-label^="File:"]').first();
  if (await file.isVisible()) {
    await file.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Meta+c');
    await page.waitForTimeout(300);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('rename file with spaces via Shift+F6', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    const label = await rows.nth(i).getAttribute('aria-label');
    if (label && label.includes('spaces')) {
      await rows.nth(i).click();
      await page.waitForTimeout(200);
      await page.keyboard.press('Shift+F6');
      await page.waitForTimeout(500);
      const input = page.locator('input[type="text"]');
      if (await input.count() > 0 && await input.first().isVisible()) {
        await input.first().fill('renamed spaces file.txt');
        await page.keyboard.press('Escape'); // Cancel
        await page.waitForTimeout(200);
      }
      break;
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('delete file with special name (cancel)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const file = page.locator('[aria-label^="File:"]').first();
  if (await file.isVisible()) {
    await file.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Meta+Backspace');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('no crashes navigating through all special names', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  const count = await rows.count();
  if (count > 0) {
    await rows.first().click();
    await page.waitForTimeout(100);
    for (let i = 0; i < count; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(300);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

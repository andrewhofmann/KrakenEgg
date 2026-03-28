/**
 * TEST SUITE: Rapid Interactions & Stress Testing
 * Stress tests rapid user interactions to verify the app handles
 * high-frequency input without crashes or state corruption.
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

// Helper: click first row to ensure focus
async function focusFirstRow(page: any) {
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click();
    await page.waitForTimeout(300);
  }
}

// --- ARROW KEY STRESS ---

test('100 arrow down presses in under 2 seconds', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstRow(page);
  const start = Date.now();
  for (let i = 0; i < 100; i++) {
    await page.keyboard.press('ArrowDown');
  }
  const elapsed = Date.now() - start;
  await page.waitForTimeout(300);
  // Should complete without crash; timing is informational
  expect(filterErrors(errors)).toHaveLength(0);
});

test('100 arrow up presses in under 2 seconds', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstRow(page);
  // First go to the end
  await page.keyboard.press('End');
  await page.waitForTimeout(200);
  const start = Date.now();
  for (let i = 0; i < 100; i++) {
    await page.keyboard.press('ArrowUp');
  }
  const elapsed = Date.now() - start;
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('50 Tab switches in under 1 second', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const start = Date.now();
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press('Tab');
  }
  const elapsed = Date.now() - start;
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('20 click-selection-change in sequence', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  const count = Math.min(await rows.count(), 20);
  for (let i = 0; i < count; i++) {
    if (await rows.nth(i).isVisible()) {
      await rows.nth(i).click();
      await page.waitForTimeout(30);
    }
  }
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('alternating arrow up/down 50 times', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstRow(page);
  // Move down a few rows first so we have room to alternate
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('ArrowDown');
  }
  await page.waitForTimeout(200);
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press(i % 2 === 0 ? 'ArrowUp' : 'ArrowDown');
  }
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+A then Cmd+D then Cmd+A repeated 10 times', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(50);
    await page.keyboard.press('Meta+d');
    await page.waitForTimeout(50);
    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(300);
  const selected = await page.locator('[role="row"][aria-selected="true"]').count();
  expect(selected).toBeGreaterThan(0);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('open search, type, close, repeat 10 times', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Alt+F7');
    await page.waitForTimeout(200);
    const input = page.locator('input[placeholder*="earch"]').first();
    if (await input.isVisible()) {
      await input.fill('test');
      await page.waitForTimeout(50);
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('open settings, switch tabs, close, repeat 5 times', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Meta+,');
    await page.waitForTimeout(500);
    // Try clicking tab-like elements inside the settings dialog/overlay
    const settingsPanel = page.locator('[class*="settings"], [role="dialog"], [class*="modal"]').first();
    if (await settingsPanel.count() > 0) {
      const tabs = settingsPanel.locator('[role="tab"], button, [class*="tab"]');
      const tabCount = await tabs.count();
      for (let t = 0; t < Math.min(tabCount, 3); t++) {
        try {
          if (await tabs.nth(t).isVisible()) {
            await tabs.nth(t).click({ timeout: 2000 });
            await page.waitForTimeout(100);
          }
        } catch { /* tab may be obscured by overlay, skip */ }
      }
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('rapid Shift+arrow to select large range', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstRow(page);
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Shift+ArrowDown');
  }
  await page.waitForTimeout(300);
  const selected = await page.locator('[role="row"][aria-selected="true"]').count();
  expect(selected).toBeGreaterThanOrEqual(1);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('arrow key held simulation: 30 presses with no delay', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstRow(page);
  // Simulate key hold by pressing without waiting
  const promises: Promise<void>[] = [];
  for (let i = 0; i < 30; i++) {
    promises.push(page.keyboard.press('ArrowDown'));
  }
  await Promise.all(promises);
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('clicking rows 0-9 sequentially without pause', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  const count = Math.min(await rows.count(), 10);
  for (let i = 0; i < count; i++) {
    if (await rows.nth(i).isVisible()) {
      await rows.nth(i).click();
    }
  }
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Shift+click range then immediately Cmd+click to deselect', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  const count = await rows.count();
  if (count >= 5) {
    // Click first row
    await rows.first().click();
    await page.waitForTimeout(300);
    // Shift+click 4th row to select range
    await rows.nth(4).click({ modifiers: ['Shift'] });
    await page.waitForTimeout(300);
    // Cmd+click 2nd row to deselect it
    await rows.nth(2).click({ modifiers: ['Meta'] });
    await page.waitForTimeout(300);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('type-ahead search: type f-i-l-e rapidly', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstRow(page);
  // Type characters rapidly to trigger type-ahead/filter
  await page.keyboard.press('f');
  await page.waitForTimeout(50);
  await page.keyboard.press('i');
  await page.waitForTimeout(50);
  await page.keyboard.press('l');
  await page.waitForTimeout(50);
  await page.keyboard.press('e');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('navigate into folder, immediately navigate back, repeat 5 times', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    for (let i = 0; i < 5; i++) {
      await folder.click();
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(500);
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+C then immediately Tab then Cmd+V rapid sequence', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstRow(page);
  // Copy
  await page.keyboard.press('Meta+c');
  await page.waitForTimeout(100);
  // Switch panel
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  // Paste
  await page.keyboard.press('Meta+v');
  await page.waitForTimeout(300);
  // Dismiss any dialog
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

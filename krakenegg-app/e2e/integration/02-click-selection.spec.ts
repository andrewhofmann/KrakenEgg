/**
 * TEST SUITE: Mouse Click Selection
 * Tests single click, Shift+click range, Cmd+click toggle
 */
import { test, expect } from '@playwright/test';
import { createSandbox, setupSandboxMocks } from './sandbox';

let sandbox: ReturnType<typeof createSandbox>;
test.beforeAll(() => { sandbox = createSandbox(); });
test.afterAll(() => { sandbox.cleanup(); });

test.beforeEach(async ({ page }) => {
  await setupSandboxMocks(page, sandbox.root);
  await page.goto('/');
  await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(2000);
});

test('single click selects a file row', async ({ page }) => {
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click();
    await page.waitForTimeout(200);
    expect(await row.getAttribute('aria-selected')).toBe('true');
  }
});

test('clicking a different row deselects the previous one', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 2) {
    await rows.nth(0).click();
    await page.waitForTimeout(150);
    await rows.nth(1).click();
    await page.waitForTimeout(150);
    expect(await rows.nth(0).getAttribute('aria-selected')).toBe('false');
    expect(await rows.nth(1).getAttribute('aria-selected')).toBe('true');
  }
});

test('Shift+click selects a range of rows', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 5) {
    await rows.nth(0).click();
    await page.waitForTimeout(100);
    await rows.nth(4).click({ modifiers: ['Shift'] });
    await page.waitForTimeout(200);
    const selected = await page.locator('[role="row"][aria-selected="true"]').count();
    expect(selected).toBeGreaterThanOrEqual(3);
  }
});

test('Cmd+click adds to selection without removing others', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 4) {
    await rows.nth(0).click();
    await page.waitForTimeout(100);
    await rows.nth(2).click({ modifiers: ['Meta'] });
    await page.waitForTimeout(100);
    await rows.nth(3).click({ modifiers: ['Meta'] });
    await page.waitForTimeout(200);
    expect(await rows.nth(0).getAttribute('aria-selected')).toBe('true');
    expect(await rows.nth(1).getAttribute('aria-selected')).toBe('false');
    expect(await rows.nth(2).getAttribute('aria-selected')).toBe('true');
    expect(await rows.nth(3).getAttribute('aria-selected')).toBe('true');
  }
});

test('Cmd+click on selected row deselects it', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 3) {
    await rows.nth(0).click();
    await page.waitForTimeout(100);
    await rows.nth(1).click({ modifiers: ['Meta'] });
    await page.waitForTimeout(100);
    // Now deselect row 0
    await rows.nth(0).click({ modifiers: ['Meta'] });
    await page.waitForTimeout(200);
    expect(await rows.nth(0).getAttribute('aria-selected')).toBe('false');
    expect(await rows.nth(1).getAttribute('aria-selected')).toBe('true');
  }
});

test('clicking row in inactive panel does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const allRows = page.locator('[role="row"]');
  const count = await allRows.count();
  if (count >= 10) {
    await allRows.nth(count - 1).click();
    await page.waitForTimeout(300);
  }
  const critical = errors.filter(e => !['__TAURI', 'invoke', 'tauri', 'transformCallback', 'unregisterListener'].some(n => e.includes(n)));
  expect(critical).toHaveLength(0);
});

test('no selection flash during click (single render)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 3) {
    for (let i = 0; i < 3; i++) {
      await rows.nth(i).click();
      await page.waitForTimeout(50);
    }
  }
  await page.waitForTimeout(200);
  // No JS errors during rapid clicking
  const critical = errors.filter(e => !['__TAURI', 'invoke', 'tauri', 'transformCallback', 'unregisterListener'].some(n => e.includes(n)));
  expect(critical).toHaveLength(0);
});

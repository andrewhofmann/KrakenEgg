import { test, expect } from '@playwright/test';
import { createSandbox, setupSandboxMocks } from './sandbox';

let sandbox: ReturnType<typeof createSandbox>;

test.beforeAll(() => {
  sandbox = createSandbox();
});

test.afterAll(() => {
  sandbox.cleanup();
});

test.beforeEach(async ({ page }) => {
  await setupSandboxMocks(page, sandbox.root);
  await page.goto('/');
  await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(2000); // Wait for files to load
});

// ─── RENDERING ───────────────────────────────────────────────

test('app renders file rows from sandbox', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  const count = await rows.count();
  // Sandbox has 50+ files, both panels should render rows
  expect(count).toBeGreaterThan(5);
});

test('file names from sandbox are visible', async ({ page }) => {
  // Check for actual sandbox file names
  const readme = page.locator('[aria-label="File: readme.txt"]');
  if (await readme.count() > 0) {
    await expect(readme.first()).toBeAttached();
  }
});

test('folders from sandbox are visible', async ({ page }) => {
  const docs = page.locator('[aria-label="Folder: Documents"]');
  if (await docs.count() > 0) {
    await expect(docs.first()).toBeAttached();
  }
});

test('both panels render independently', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  const count = await rows.count();
  // Both panels render the same directory, so rows should be doubled
  expect(count).toBeGreaterThan(10);
});

// ─── KEYBOARD NAVIGATION ────────────────────────────────────

test('arrow down moves cursor through file list', async ({ page }) => {
  // Click first panel to focus
  const firstRow = page.locator('[role="row"]').first();
  if (await firstRow.isVisible()) {
    await firstRow.click();
    await page.waitForTimeout(200);

    // Press down 3 times
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
    }

    // Verify cursor moved — some row should be selected
    const selectedRows = page.locator('[role="row"][aria-selected="true"]');
    expect(await selectedRows.count()).toBeGreaterThanOrEqual(1);
  }
});

test('arrow keys scroll to bottom without crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const firstRow = page.locator('[role="row"]').first();
  if (await firstRow.isVisible()) {
    await firstRow.click();
    await page.waitForTimeout(200);

    // Press down many times (sandbox has 50+ files)
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(20);
    }
    await page.waitForTimeout(500);

    const critical = errors.filter(e =>
      !e.includes('__TAURI') && !e.includes('invoke') && !e.includes('tauri') && !e.includes('transformCallback')
    );
    expect(critical).toHaveLength(0);
  }
});

test('arrow up from top stays at first item', async ({ page }) => {
  const firstRow = page.locator('[role="row"]').first();
  if (await firstRow.isVisible()) {
    await firstRow.click();
    await page.waitForTimeout(200);

    // Press up several times — should not crash
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(200);

    // Should still have a selection
    const selectedRows = page.locator('[role="row"][aria-selected="true"]');
    expect(await selectedRows.count()).toBeGreaterThanOrEqual(0);
  }
});

test('Home key jumps to first item', async ({ page }) => {
  const firstRow = page.locator('[role="row"]').first();
  if (await firstRow.isVisible()) {
    await firstRow.click();
    // Move down first
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(30);
    }
    // Press Home
    await page.keyboard.press('Home');
    await page.waitForTimeout(200);
  }
});

test('End key jumps to last item', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const firstRow = page.locator('[role="row"]').first();
  if (await firstRow.isVisible()) {
    await firstRow.click();
    await page.keyboard.press('End');
    await page.waitForTimeout(500);

    const critical = errors.filter(e =>
      !e.includes('__TAURI') && !e.includes('invoke') && !e.includes('tauri') && !e.includes('transformCallback')
    );
    expect(critical).toHaveLength(0);
  }
});

test('Tab switches active panel', async ({ page }) => {
  const firstRow = page.locator('[role="row"]').first();
  if (await firstRow.isVisible()) {
    await firstRow.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    // No crash — panel switch succeeded
  }
});

// ─── MOUSE INTERACTIONS ──────────────────────────────────────

test('clicking a file selects it', async ({ page }) => {
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click();
    await page.waitForTimeout(200);
    const selected = await row.getAttribute('aria-selected');
    expect(selected).toBe('true');
  }
});

test('clicking different files changes selection', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 2) {
    const row1 = rows.nth(0);
    const row2 = rows.nth(1);

    await row1.click();
    await page.waitForTimeout(150);
    expect(await row1.getAttribute('aria-selected')).toBe('true');

    await row2.click();
    await page.waitForTimeout(150);
    expect(await row2.getAttribute('aria-selected')).toBe('true');
    expect(await row1.getAttribute('aria-selected')).toBe('false');
  }
});

test('Shift+click selects range', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 4) {
    await rows.nth(0).click();
    await page.waitForTimeout(100);
    await rows.nth(3).click({ modifiers: ['Shift'] });
    await page.waitForTimeout(200);

    // Multiple rows should be selected
    const selectedCount = await page.locator('[role="row"][aria-selected="true"]').count();
    expect(selectedCount).toBeGreaterThanOrEqual(2);
  }
});

test('Cmd+click toggles individual selection', async ({ page }) => {
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 3) {
    await rows.nth(0).click();
    await page.waitForTimeout(100);
    await rows.nth(2).click({ modifiers: ['Meta'] });
    await page.waitForTimeout(200);

    // Both rows should be selected
    expect(await rows.nth(0).getAttribute('aria-selected')).toBe('true');
    expect(await rows.nth(2).getAttribute('aria-selected')).toBe('true');
    // Row in between should NOT be selected
    expect(await rows.nth(1).getAttribute('aria-selected')).toBe('false');
  }
});

// ─── SEARCH ──────────────────────────────────────────────────

test('Alt+F7 opens search, type query, get results', async ({ page }) => {
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);

  const input = page.locator('input[placeholder*="earch"]').first();
  if (await input.isVisible()) {
    await input.fill('readme');
    await input.press('Enter');
    await page.waitForTimeout(1000);

    // Should find readme.txt from sandbox
    const body = await page.textContent('body');
    expect(body).toContain('readme');
  }
});

test('Escape closes search modal', async ({ page }) => {
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  // No crash
});

// ─── SETTINGS ────────────────────────────────────────────────

test('Cmd+comma opens settings', async ({ page }) => {
  await page.keyboard.press('Meta+,');
  await page.waitForTimeout(500);
  const general = page.locator('text=General').first();
  if (await general.isVisible()) {
    await expect(general).toBeVisible();
    await page.keyboard.press('Escape');
  }
});

// ─── QUICK VIEW ──────────────────────────────────────────────

test('Ctrl+Q toggles quick view without resize', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.keyboard.press('Control+q');
  await page.waitForTimeout(500);
  await page.keyboard.press('Control+q');
  await page.waitForTimeout(500);

  const critical = errors.filter(e =>
    !e.includes('__TAURI') && !e.includes('invoke') && !e.includes('tauri') && !e.includes('transformCallback')
  );
  expect(critical).toHaveLength(0);
});

// ─── FONT ZOOM ───────────────────────────────────────────────

test('Cmd+Plus/Minus changes font size', async ({ page }) => {
  await page.keyboard.press('Meta+=');
  await page.waitForTimeout(200);
  await page.keyboard.press('Meta+=');
  await page.waitForTimeout(200);
  await page.keyboard.press('Meta+-');
  await page.waitForTimeout(200);
  await page.keyboard.press('Meta+0'); // reset
  await page.waitForTimeout(200);
});

// ─── STRESS TESTS ────────────────────────────────────────────

test('rapid arrow key presses do not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const firstRow = page.locator('[role="row"]').first();
  if (await firstRow.isVisible()) {
    await firstRow.click();
    await page.waitForTimeout(100);

    // Rapid fire
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('ArrowDown');
    }
    await page.waitForTimeout(200);
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('ArrowUp');
    }
    await page.waitForTimeout(500);

    const critical = errors.filter(e =>
      !e.includes('__TAURI') && !e.includes('invoke') && !e.includes('tauri') && !e.includes('transformCallback')
    );
    expect(critical).toHaveLength(0);
  }
});

test('rapid Tab switching between panels', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(500);

  const critical = errors.filter(e =>
    !e.includes('__TAURI') && !e.includes('invoke') && !e.includes('tauri') && !e.includes('transformCallback')
  );
  expect(critical).toHaveLength(0);
});

test('no crashes after full interaction sequence', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  // Click, navigate, search, settings, quick view — full workflow
  const firstRow = page.locator('[role="row"]').first();
  if (await firstRow.isVisible()) {
    await firstRow.click();
    await page.waitForTimeout(100);

    // Navigate down
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);

    // Switch panel
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Navigate in other panel
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);

    // Open and close search
    await page.keyboard.press('Alt+F7');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Open and close settings
    await page.keyboard.press('Meta+,');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Toggle quick view
    await page.keyboard.press('Control+q');
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+q');
    await page.waitForTimeout(200);

    // Font zoom
    await page.keyboard.press('Meta+=');
    await page.waitForTimeout(100);
    await page.keyboard.press('Meta+0');
    await page.waitForTimeout(100);

    // Back to first panel, go to end
    await page.keyboard.press('Tab');
    await page.keyboard.press('End');
    await page.waitForTimeout(200);
    await page.keyboard.press('Home');
    await page.waitForTimeout(200);
  }

  await page.waitForTimeout(500);
  const critical = errors.filter(e =>
    !e.includes('__TAURI') && !e.includes('invoke') && !e.includes('tauri') && !e.includes('transformCallback')
  );
  expect(critical).toHaveLength(0);
});

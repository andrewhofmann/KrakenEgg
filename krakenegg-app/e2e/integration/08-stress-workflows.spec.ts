/**
 * TEST SUITE: Stress Tests & Full Workflows
 * Tests rapid interactions, multi-step workflows, edge cases
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

// --- RAPID INTERACTIONS ---

test('rapid arrow key presses (50x down, 50x up) no crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click();
    await page.waitForTimeout(100);
    for (let i = 0; i < 50; i++) await page.keyboard.press('ArrowDown');
    for (let i = 0; i < 50; i++) await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('rapid Tab switching (20x) no crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('rapid modal open/close cycling no crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Alt+F7');
    await page.waitForTimeout(150);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
  }
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Meta+,');
    await page.waitForTimeout(150);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('rapid click on many different rows', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const rows = page.locator('[role="row"]');
  const count = Math.min(await rows.count(), 10);
  for (let i = 0; i < count; i++) {
    if (await rows.nth(i).isVisible()) {
      await rows.nth(i).click();
      await page.waitForTimeout(30);
    }
  }
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- FULL WORKFLOW: Navigate, Select, Copy, Switch, Paste ---

test('workflow: navigate into folder, select file, copy, switch, paste', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // 1. Find and enter a folder
  const folderRow = page.locator('[aria-label^="Folder:"]').first();
  if (await folderRow.isVisible()) {
    await folderRow.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  }

  // 2. Select first file
  const fileRow = page.locator('[aria-label^="File:"]').first();
  if (await fileRow.isVisible()) {
    await fileRow.click();
    await page.waitForTimeout(200);
    // 3. Copy
    await page.keyboard.press('Meta+c');
    await page.waitForTimeout(300);
  }

  // 4. Switch panel
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);

  // 5. Paste
  await page.keyboard.press('Meta+v');
  await page.waitForTimeout(500);

  // 6. Dismiss dialog
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  expect(filterErrors(errors)).toHaveLength(0);
});

// --- FULL WORKFLOW: Select multiple, delete ---

test('workflow: select 3 files, delete, cancel', async ({ page }) => {
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
    await page.waitForTimeout(200);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- FULL WORKFLOW: Search, click result ---

test('workflow: search for file, results appear', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  const input = page.locator('input[placeholder*="earch"]').first();
  if (await input.isVisible()) {
    await input.fill('readme');
    await input.press('Enter');
    await page.waitForTimeout(1000);

    // Check results appeared
    const body = await page.textContent('body');
    expect(body?.toLowerCase()).toContain('readme');

    await page.keyboard.press('Escape');
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- FULL WORKFLOW: Create folder, navigate in, create file ---

test('workflow: F7 create folder, then Shift+F4 create file', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Create folder
  await page.keyboard.press('F7');
  await page.waitForTimeout(500);
  const input1 = page.locator('input[type="text"]');
  if (await input1.count() > 0 && await input1.first().isVisible()) {
    await input1.first().fill('NewTestFolder');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }

  // Create file
  await page.keyboard.press('Shift+F4');
  await page.waitForTimeout(500);
  const input2 = page.locator('input[type="text"]');
  if (await input2.count() > 0 && await input2.first().isVisible()) {
    await input2.first().fill('newfile.txt');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }

  expect(filterErrors(errors)).toHaveLength(0);
});

// --- FULL WORKFLOW: Rename file ---

test('workflow: select file, rename via Shift+F6', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  const fileRow = page.locator('[aria-label^="File:"]').first();
  if (await fileRow.isVisible()) {
    await fileRow.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Shift+F6');
    await page.waitForTimeout(500);

    const inputs = page.locator('input[type="text"]');
    if (await inputs.count() > 0 && await inputs.first().isVisible()) {
      await inputs.first().fill('renamed_file.txt');
      await page.keyboard.press('Escape'); // Cancel rename
      await page.waitForTimeout(200);
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- EDGE CASES ---

test('pressing Enter with no file selected does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('pressing F3/F4 with no file selected does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('F3');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  await page.keyboard.press('F4');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('pressing delete with no selection does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+Backspace');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Ctrl+H toggle hidden files does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Control+h');
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+h');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('full interaction sequence: everything at once', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  const rows = page.locator('[role="row"]');
  if (await rows.count() > 0) {
    // Click, arrows, selection
    await rows.first().click();
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);

    // Switch panel, navigate
    await page.keyboard.press('Tab');
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);

    // Open/close modals
    await page.keyboard.press('Alt+F7');
    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Meta+,');
    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Quick view toggle
    await page.keyboard.press('Control+q');
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+q');
    await page.waitForTimeout(100);

    // Font zoom
    await page.keyboard.press('Meta+=');
    await page.keyboard.press('Meta+0');
    await page.waitForTimeout(100);

    // Selection operations
    await page.keyboard.press('Tab');
    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(100);
    await page.keyboard.press('Meta+d');
    await page.waitForTimeout(100);

    // Home/End
    await page.keyboard.press('End');
    await page.waitForTimeout(100);
    await page.keyboard.press('Home');
    await page.waitForTimeout(100);

    // Hidden files toggle
    await page.keyboard.press('Control+h');
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+h');
  }

  await page.waitForTimeout(500);
  expect(filterErrors(errors)).toHaveLength(0);
});

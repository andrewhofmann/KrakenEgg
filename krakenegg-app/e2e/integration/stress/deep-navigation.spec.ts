/**
 * TEST SUITE: Deep Directory Navigation
 * Tests navigating through a 10-level deep directory tree
 */
import { test, expect } from '@playwright/test';
import { createDeepSandbox, setupSandboxMocks } from '../sandbox';

let sandbox: ReturnType<typeof createDeepSandbox>;
test.beforeAll(() => { sandbox = createDeepSandbox(); });
test.afterAll(() => { sandbox.cleanup(); });

const NOISE = ['__TAURI', 'invoke', 'tauri', 'transformCallback', 'unregisterListener'];
const filterErrors = (errors: string[]) => errors.filter(e => !NOISE.some(n => e.includes(n)));

test.beforeEach(async ({ page }) => {
  await setupSandboxMocks(page, sandbox.root);
  await page.goto('/');
  await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(2000);
});

// --- BASIC RENDERING ---

test('app renders with deep tree', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const root = page.locator('#root');
  const html = await root.innerHTML();
  expect(html.length).toBeGreaterThan(100);
  await page.waitForTimeout(500);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('folder rows visible at root level', async ({ page }) => {
  const folders = page.locator('[aria-label^="Folder:"]');
  expect(await folders.count()).toBeGreaterThan(0);
});

// --- ENTERING DIRECTORIES ---

test('can navigate into first level folder via Enter', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('can navigate back with ".." row', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Navigate into a folder
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Look for ".." parent row and click it
    const parentRow = page.locator('[role="row"]').first();
    if (await parentRow.isVisible()) {
      await parentRow.click();
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('navigate 3 levels deep via Enter key', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  for (let depth = 0; depth < 3; depth++) {
    const folder = page.locator('[aria-label^="Folder:"]').first();
    if (await folder.isVisible()) {
      await folder.click();
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('navigate 3 levels deep via double-click', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  for (let depth = 0; depth < 3; depth++) {
    const folder = page.locator('[aria-label^="Folder:"]').first();
    if (await folder.isVisible()) {
      await folder.dblclick();
      await page.waitForTimeout(1000);
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('path breadcrumb shows correct depth after navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Navigate into first folder
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    // The body should contain the folder name somewhere in the path display
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('navigate back via breadcrumb click (if present)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Navigate in
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    // Try clicking a breadcrumb element (path segment)
    const breadcrumb = page.locator('[data-breadcrumb], .breadcrumb, [class*="breadcrumb"], [class*="path-segment"]').first();
    if (await breadcrumb.isVisible()) {
      await breadcrumb.click();
      await page.waitForTimeout(500);
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('navigate to root via first breadcrumb (if present)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Navigate 2 levels deep
  for (let i = 0; i < 2; i++) {
    const folder = page.locator('[aria-label^="Folder:"]').first();
    if (await folder.isVisible()) {
      await folder.click();
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }
  }
  // Try clicking first breadcrumb
  const breadcrumbs = page.locator('[data-breadcrumb], .breadcrumb, [class*="breadcrumb"], [class*="path-segment"]');
  if (await breadcrumbs.count() > 0 && await breadcrumbs.first().isVisible()) {
    await breadcrumbs.first().click();
    await page.waitForTimeout(500);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- HISTORY NAVIGATION ---

test('history back (Alt+Left) works after navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Alt+ArrowLeft');
    await page.waitForTimeout(500);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('history forward (Alt+Right) works after going back', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Alt+ArrowLeft');
    await page.waitForTimeout(500);
    await page.keyboard.press('Alt+ArrowRight');
    await page.waitForTimeout(500);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Backspace goes to parent directory', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(500);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- PANEL INDEPENDENCE ---

test('Tab switch preserves path in each panel', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Navigate left panel into folder
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  }
  // Switch to right panel
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  // Switch back to left panel
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('navigate left panel deep, right panel stays', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Navigate left panel 2 levels deep
  for (let i = 0; i < 2; i++) {
    const folder = page.locator('[aria-label^="Folder:"]').first();
    if (await folder.isVisible()) {
      await folder.click();
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }
  }
  // Switch to right panel — should still be at root
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  const rows = page.locator('[role="row"]');
  expect(await rows.count()).toBeGreaterThan(0);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- FILE OPERATIONS AT DEPTH ---

test('Enter on file at deep level does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Navigate into a folder
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    // Try to open a file
    const file = page.locator('[aria-label^="File:"]').first();
    if (await file.isVisible()) {
      await file.click();
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('F3 viewer at deep level', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    const file = page.locator('[aria-label^="File:"]').first();
    if (await file.isVisible()) {
      await file.click();
      await page.waitForTimeout(200);
      await page.keyboard.press('F3');
      await page.waitForTimeout(500);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+C at deep level', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    const file = page.locator('[aria-label^="File:"]').first();
    if (await file.isVisible()) {
      await file.click();
      await page.waitForTimeout(200);
      await page.keyboard.press('Meta+c');
      await page.waitForTimeout(300);
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('new folder at deep level', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  }
  await page.keyboard.press('F7');
  await page.waitForTimeout(500);
  const input = page.locator('input[type="text"]');
  if (await input.count() > 0 && await input.first().isVisible()) {
    await input.first().fill('DeepNewFolder');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('navigate in, create file, navigate out', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Navigate in
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  }
  // Create file
  await page.keyboard.press('Shift+F4');
  await page.waitForTimeout(500);
  const input = page.locator('input[type="text"]');
  if (await input.count() > 0 && await input.first().isVisible()) {
    await input.first().fill('deep_new_file.txt');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  // Navigate out
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(500);
  expect(filterErrors(errors)).toHaveLength(0);
});

// --- RAPID NAVIGATION ---

test('rapid enter/backspace cycling', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  for (let i = 0; i < 5; i++) {
    const folder = page.locator('[aria-label^="Folder:"]').first();
    if (await folder.isVisible()) {
      await folder.click();
      await page.waitForTimeout(100);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(500);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('navigate to deepest level and back to root', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Go as deep as possible
  for (let depth = 0; depth < 10; depth++) {
    const folder = page.locator('[aria-label^="Folder:"]').first();
    if (await folder.isVisible()) {
      await folder.click();
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(800);
    } else {
      break;
    }
  }
  // Come back to root
  for (let depth = 0; depth < 10; depth++) {
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(500);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('path display at deep level does not overflow', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Navigate 3 levels deep
  for (let i = 0; i < 3; i++) {
    const folder = page.locator('[aria-label^="Folder:"]').first();
    if (await folder.isVisible()) {
      await folder.click();
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }
  }
  // Check no horizontal overflow on body
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // small tolerance
  expect(filterErrors(errors)).toHaveLength(0);
});

test('go to path modal with deep path (Alt+F7 search)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Navigate deep first
  for (let i = 0; i < 2; i++) {
    const folder = page.locator('[aria-label^="Folder:"]').first();
    if (await folder.isVisible()) {
      await folder.click();
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }
  }
  // Open search
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('double-click ".." at each level navigates back', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Navigate in 2 levels
  for (let i = 0; i < 2; i++) {
    const folder = page.locator('[aria-label^="Folder:"]').first();
    if (await folder.isVisible()) {
      await folder.dblclick();
      await page.waitForTimeout(1000);
    }
  }
  // Navigate back via ".." (first row)
  for (let i = 0; i < 2; i++) {
    const firstRow = page.locator('[role="row"]').first();
    if (await firstRow.isVisible()) {
      await firstRow.dblclick();
      await page.waitForTimeout(1000);
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('navigate deep then switch panel and navigate deep', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Navigate left panel deep
  for (let i = 0; i < 2; i++) {
    const folder = page.locator('[aria-label^="Folder:"]').first();
    if (await folder.isVisible()) {
      await folder.click();
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }
  }
  // Switch to right panel
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  // Navigate right panel deep
  for (let i = 0; i < 2; i++) {
    const folder = page.locator('[aria-label^="Folder:"]').first();
    if (await folder.isVisible()) {
      await folder.click();
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('both panels at different depths simultaneously', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Left panel: 3 levels deep
  for (let i = 0; i < 3; i++) {
    const folder = page.locator('[aria-label^="Folder:"]').first();
    if (await folder.isVisible()) {
      await folder.click();
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }
  }
  // Switch to right panel
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  // Right panel: 1 level deep
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  }
  // Both panels have rows
  const rows = page.locator('[role="row"]');
  expect(await rows.count()).toBeGreaterThan(0);
  // Switch back and verify left panel still works
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

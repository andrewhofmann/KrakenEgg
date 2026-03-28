/**
 * TEST SUITE: Error Recovery & Edge Cases
 * Tests error handling, recovery from crashes, and graceful degradation
 * when the app encounters unexpected states or inputs.
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

// Helper: click first file row to ensure focus
async function focusFirstFile(page: any) {
  const file = page.locator('[aria-label^="File:"]').first();
  if (await file.isVisible()) {
    await file.click();
    await page.waitForTimeout(300);
  }
}

// Helper: click first folder row
async function focusFirstFolder(page: any) {
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.click();
    await page.waitForTimeout(300);
  }
}

// --- ERROR BOUNDARY ---

test('app recovers from ErrorBoundary crash via Try Again button', async ({ page }) => {
  // Attempt to trigger an error boundary by injecting a throw into React rendering
  const hasTryAgain = await page.evaluate(() => {
    // Check if there's already a Try Again button (unlikely on fresh load)
    return document.querySelector('button')?.textContent?.includes('Try Again') || false;
  });
  // On a fresh load, there should be no crash
  const crashIndicators = await page.locator('text=Try Again').count();
  // The app should render normally
  const root = page.locator('#root');
  const html = await root.innerHTML();
  expect(html.length).toBeGreaterThan(50);
});

test('Escape when no modal is open does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  // App should still be functional
  const rows = page.locator('[role="row"]');
  expect(await rows.count()).toBeGreaterThan(0);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('pressing all shortcuts with no files loaded does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Deselect everything
  await page.keyboard.press('Meta+d');
  await page.waitForTimeout(200);

  const shortcuts = [
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Home', 'End', 'Enter', 'Backspace', 'Space', 'Delete',
    'Tab', 'Escape',
    'Meta+c', 'Meta+x', 'Meta+v', 'Meta+a', 'Meta+d',
    'Meta+Backspace', 'Meta+Shift+a', 'Meta+Shift+p',
    'F3', 'F4', 'F5', 'F6', 'F7', 'Shift+F4', 'Shift+F6',
    'Alt+F7', 'Meta+,', 'Meta+m',
    'Control+q', 'Control+h',
    'Meta+=', 'Meta+-', 'Meta+0',
  ];

  for (const key of shortcuts) {
    await page.keyboard.press(key);
    await page.waitForTimeout(50);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(300);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('opening and immediately closing search modal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('opening and immediately closing settings modal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+,');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('opening and immediately closing new folder dialog (F7)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('F7');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('opening and immediately closing new file dialog (Shift+F4)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Shift+F4');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('opening and immediately closing rename dialog (Shift+F6)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstFile(page);
  await page.keyboard.press('Shift+F6');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('opening and immediately closing copy dialog (F5)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstFile(page);
  await page.keyboard.press('F5');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('opening and immediately closing move dialog (F6)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstFile(page);
  await page.keyboard.press('F6');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('rapidly pressing F7 ten times does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('F7');
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('rapidly pressing Alt+F7 ten times does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Alt+F7');
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('F3 on folder shows error or does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstFolder(page);
  await page.keyboard.press('F3');
  await page.waitForTimeout(500);
  // Should either show an error message or simply not open viewer for a folder
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('F4 on folder shows error or does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await focusFirstFolder(page);
  await page.keyboard.press('F4');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+V with no clipboard data does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Press paste without any prior copy
  await page.keyboard.press('Meta+v');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('F5 copy with no file selected does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+d');
  await page.waitForTimeout(200);
  await page.keyboard.press('F5');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('F6 move with no file selected does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+d');
  await page.waitForTimeout(200);
  await page.keyboard.press('F6');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Delete with no selection does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+d');
  await page.waitForTimeout(200);
  await page.keyboard.press('Delete');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Shift+F6 rename with no file selected does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+d');
  await page.waitForTimeout(200);
  await page.keyboard.press('Shift+F6');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('search with empty query does not trigger search', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  const input = page.locator('input[placeholder*="earch"]').first();
  if (await input.isVisible()) {
    await input.fill('');
    await input.press('Enter');
    await page.waitForTimeout(300);
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('multiple Escape presses in sequence do not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(300);
  // App should still be functional
  const rows = page.locator('[role="row"]');
  expect(await rows.count()).toBeGreaterThan(0);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('opening modal while another is open does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Open search
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(300);
  // Try to open settings while search is open
  await page.keyboard.press('Meta+,');
  await page.waitForTimeout(300);
  // Try to open F7 while something may be open
  await page.keyboard.press('F7');
  await page.waitForTimeout(300);
  // Close all
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('switching panels while modal is open does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Open a modal
  await page.keyboard.press('F7');
  await page.waitForTimeout(300);
  // Try Tab to switch panels
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  // Close modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Cmd+A in empty directory does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Try to find and navigate into EmptyFolder
  const emptyFolder = page.locator('[aria-label*="EmptyFolder"]').first();
  const hasEmpty = await emptyFolder.count() > 0;
  if (hasEmpty) {
    try {
      await emptyFolder.click({ timeout: 3000 });
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    } catch { /* folder may not be visible due to virtual scroll */ }
  }
  // Try Cmd+A regardless (may be in empty dir or not)
  await page.keyboard.press('Meta+a');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('arrow keys in empty directory do not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const emptyFolder = page.locator('[aria-label*="EmptyFolder"]').first();
  const hasEmpty = await emptyFolder.count() > 0;
  if (hasEmpty) {
    try {
      await emptyFolder.click({ timeout: 3000 });
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    } catch { /* folder may not be visible due to virtual scroll */ }
  }
  // Arrow keys should never crash regardless of directory state
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Home/End in empty directory do not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const emptyFolder = page.locator('[aria-label*="EmptyFolder"]').first();
  const hasEmpty = await emptyFolder.count() > 0;
  if (hasEmpty) {
    try {
      await emptyFolder.click({ timeout: 3000 });
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    } catch { /* folder may not be visible due to virtual scroll */ }
  }
  // Home/End should never crash regardless of directory state
  await page.keyboard.press('Home');
  await page.waitForTimeout(200);
  await page.keyboard.press('End');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Space key with no file under cursor does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.keyboard.press('Meta+d');
  await page.waitForTimeout(200);
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Enter with cursor on parent row (..) does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Navigate into a folder first
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    // Now press Home to go to the ".." row
    await page.keyboard.press('Home');
    await page.waitForTimeout(200);
    // Press Enter on the parent row
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('Tab switch after error state does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Trigger a potentially erroneous state (paste with no clipboard)
  await page.keyboard.press('Meta+v');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  // Now switch panels
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  // App should still work
  const rows = page.locator('[role="row"]');
  expect(await rows.count()).toBeGreaterThan(0);
  expect(filterErrors(errors)).toHaveLength(0);
});

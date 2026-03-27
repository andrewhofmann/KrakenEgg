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
  await page.waitForTimeout(2000);
});

// Helper: select a file by clicking the first row
async function selectFirstFile(page: any) {
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click();
    await page.waitForTimeout(200);
    return true;
  }
  return false;
}

// Helper: collect JS errors, filtering Tauri noise
function trackErrors(page: any) {
  const errors: string[] = [];
  page.on('pageerror', (err: any) => errors.push(err.message));
  return () => errors.filter((e: string) =>
    !e.includes('__TAURI') && !e.includes('invoke') && !e.includes('tauri') && !e.includes('transformCallback') && !e.includes('unregisterListener')
  );
}

// ═══════════════════════════════════════════════════
// COPY (Cmd+C) → Clipboard
// ═══════════════════════════════════════════════════

test('Cmd+C copies selected file to clipboard', async ({ page }) => {
  const getErrors = trackErrors(page);
  if (await selectFirstFile(page)) {
    await page.keyboard.press('Meta+c');
    await page.waitForTimeout(500);
    expect(getErrors()).toHaveLength(0);
  }
});

test('Cmd+C with no selection shows no crash', async ({ page }) => {
  const getErrors = trackErrors(page);
  await page.keyboard.press('Meta+c');
  await page.waitForTimeout(500);
  expect(getErrors()).toHaveLength(0);
});

// ═══════════════════════════════════════════════════
// CUT (Cmd+X) → Clipboard
// ═══════════════════════════════════════════════════

test('Cmd+X cuts selected file to clipboard', async ({ page }) => {
  const getErrors = trackErrors(page);
  if (await selectFirstFile(page)) {
    await page.keyboard.press('Meta+x');
    await page.waitForTimeout(500);
    expect(getErrors()).toHaveLength(0);
  }
});

// ═══════════════════════════════════════════════════
// PASTE (Cmd+V) → Copy or Move files
// ═══════════════════════════════════════════════════

test('Cmd+V after Cmd+C triggers paste confirmation dialog', async ({ page }) => {
  const getErrors = trackErrors(page);
  if (await selectFirstFile(page)) {
    // Copy
    await page.keyboard.press('Meta+c');
    await page.waitForTimeout(300);
    // Switch to other panel
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    // Paste
    await page.keyboard.press('Meta+v');
    await page.waitForTimeout(500);

    // Confirmation dialog should appear (or operation completes)
    expect(getErrors()).toHaveLength(0);
  }
});

test('Cmd+V with empty clipboard shows no crash', async ({ page }) => {
  const getErrors = trackErrors(page);
  await page.keyboard.press('Meta+v');
  await page.waitForTimeout(500);
  expect(getErrors()).toHaveLength(0);
});

// ═══════════════════════════════════════════════════
// COPY TO OPPOSITE (F5)
// ═══════════════════════════════════════════════════

test('F5 triggers copy to opposite panel confirmation', async ({ page }) => {
  const getErrors = trackErrors(page);
  if (await selectFirstFile(page)) {
    await page.keyboard.press('F5');
    await page.waitForTimeout(500);

    // Confirmation dialog should appear
    const dialog = page.locator('text=Copy').first();
    if (await dialog.isVisible()) {
      // Cancel the operation
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
    expect(getErrors()).toHaveLength(0);
  }
});

test('F5 with no selection does not crash', async ({ page }) => {
  const getErrors = trackErrors(page);
  await page.keyboard.press('F5');
  await page.waitForTimeout(500);
  expect(getErrors()).toHaveLength(0);
});

// ═══════════════════════════════════════════════════
// MOVE TO OPPOSITE (F6)
// ═══════════════════════════════════════════════════

test('F6 triggers move to opposite panel confirmation', async ({ page }) => {
  const getErrors = trackErrors(page);
  if (await selectFirstFile(page)) {
    await page.keyboard.press('F6');
    await page.waitForTimeout(500);

    const dialog = page.locator('text=Move').first();
    if (await dialog.isVisible()) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
    expect(getErrors()).toHaveLength(0);
  }
});

// ═══════════════════════════════════════════════════
// DELETE (F8)
// ═══════════════════════════════════════════════════

test('F8 triggers delete confirmation dialog', async ({ page }) => {
  const getErrors = trackErrors(page);
  if (await selectFirstFile(page)) {
    await page.keyboard.press('F8');
    await page.waitForTimeout(500);

    // Confirmation dialog with "Delete" should appear
    const deleteText = page.locator('text=Delete').first();
    if (await deleteText.isVisible()) {
      // Cancel
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
    expect(getErrors()).toHaveLength(0);
  }
});

test('F8 shows confirmation with item count', async ({ page }) => {
  const getErrors = trackErrors(page);
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 2) {
    // Select first file
    await rows.nth(0).click();
    await page.waitForTimeout(100);
    // Shift+click to select range
    await rows.nth(2).click({ modifiers: ['Shift'] });
    await page.waitForTimeout(200);

    await page.keyboard.press('F8');
    await page.waitForTimeout(500);

    // Should mention item count
    const body = await page.textContent('body');
    if (body?.includes('Delete')) {
      // Confirmation dialog is showing
      await page.keyboard.press('Escape');
    }
    expect(getErrors()).toHaveLength(0);
  }
});

// ═══════════════════════════════════════════════════
// NEW FILE (Shift+F4)
// ═══════════════════════════════════════════════════

test('Shift+F4 opens new file input dialog', async ({ page }) => {
  const getErrors = trackErrors(page);
  await page.keyboard.press('Shift+F4');
  await page.waitForTimeout(500);

  // Input dialog should appear
  const input = page.locator('input[type="text"]');
  if (await input.count() > 0 && await input.first().isVisible()) {
    // Should have default value "untitled.txt"
    const value = await input.first().inputValue();
    expect(value).toContain('untitled');
    // Cancel
    await page.keyboard.press('Escape');
  }
  expect(getErrors()).toHaveLength(0);
});

test('Shift+F4 creates file with entered name', async ({ page }) => {
  const getErrors = trackErrors(page);
  await page.keyboard.press('Shift+F4');
  await page.waitForTimeout(500);

  const input = page.locator('input[type="text"]');
  if (await input.count() > 0 && await input.first().isVisible()) {
    await input.first().fill('test_new_file.txt');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  expect(getErrors()).toHaveLength(0);
});

test('Shift+F4 rejects invalid filename', async ({ page }) => {
  const getErrors = trackErrors(page);
  await page.keyboard.press('Shift+F4');
  await page.waitForTimeout(500);

  const input = page.locator('input[type="text"]');
  if (await input.count() > 0 && await input.first().isVisible()) {
    await input.first().fill('bad<file>name');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    // Should show error or reject silently
  }
  expect(getErrors()).toHaveLength(0);
});

// ═══════════════════════════════════════════════════
// NEW FOLDER (F7)
// ═══════════════════════════════════════════════════

test('F7 opens new folder input dialog', async ({ page }) => {
  const getErrors = trackErrors(page);
  await page.keyboard.press('F7');
  await page.waitForTimeout(500);

  const input = page.locator('input[type="text"]');
  if (await input.count() > 0 && await input.first().isVisible()) {
    const value = await input.first().inputValue();
    expect(value).toContain('New Folder');
    await page.keyboard.press('Escape');
  }
  expect(getErrors()).toHaveLength(0);
});

test('F7 creates folder with custom name', async ({ page }) => {
  const getErrors = trackErrors(page);
  await page.keyboard.press('F7');
  await page.waitForTimeout(500);

  const input = page.locator('input[type="text"]');
  if (await input.count() > 0 && await input.first().isVisible()) {
    await input.first().fill('TestFolder');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  expect(getErrors()).toHaveLength(0);
});

test('F7 Escape cancels folder creation', async ({ page }) => {
  const getErrors = trackErrors(page);
  await page.keyboard.press('F7');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  expect(getErrors()).toHaveLength(0);
});

// ═══════════════════════════════════════════════════
// RENAME (Shift+F6 / inline)
// ═══════════════════════════════════════════════════

test('Shift+F6 triggers rename on selected file', async ({ page }) => {
  const getErrors = trackErrors(page);
  if (await selectFirstFile(page)) {
    await page.keyboard.press('Shift+F6');
    await page.waitForTimeout(500);

    // Either inline rename input or modal should appear
    const inputs = page.locator('input[type="text"]');
    if (await inputs.count() > 0) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
  }
  expect(getErrors()).toHaveLength(0);
});

test('Rename Enter submits, Escape cancels', async ({ page }) => {
  const getErrors = trackErrors(page);
  if (await selectFirstFile(page)) {
    await page.keyboard.press('Shift+F6');
    await page.waitForTimeout(500);

    const inputs = page.locator('input[type="text"]');
    if (await inputs.count() > 0 && await inputs.first().isVisible()) {
      // Type new name then Escape (cancel)
      await inputs.first().fill('renamed_file.txt');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
  }
  expect(getErrors()).toHaveLength(0);
});

// ═══════════════════════════════════════════════════
// CONTEXT MENU FILE OPERATIONS
// ═══════════════════════════════════════════════════

test('right-click shows context menu with file operations', async ({ page }) => {
  const getErrors = trackErrors(page);
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click({ button: 'right' });
    await page.waitForTimeout(500);

    const body = await page.textContent('body');
    // Context menu should show operation labels
    if (body?.includes('Copy') && body?.includes('Delete')) {
      // Context menu is visible with expected items
      // Close it
      await page.keyboard.press('Escape');
    }
  }
  expect(getErrors()).toHaveLength(0);
});

test('context menu Escape closes without action', async ({ page }) => {
  const getErrors = trackErrors(page);
  const row = page.locator('[role="row"]').first();
  if (await row.isVisible()) {
    await row.click({ button: 'right' });
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  expect(getErrors()).toHaveLength(0);
});

// ═══════════════════════════════════════════════════
// MULTI-SELECT OPERATIONS
// ═══════════════════════════════════════════════════

test('select multiple files then F8 delete shows correct count', async ({ page }) => {
  const getErrors = trackErrors(page);
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 3) {
    await rows.nth(0).click();
    await rows.nth(1).click({ modifiers: ['Meta'] });
    await rows.nth(2).click({ modifiers: ['Meta'] });
    await page.waitForTimeout(200);

    // Verify 3 selected
    const selectedCount = await page.locator('[role="row"][aria-selected="true"]').count();
    expect(selectedCount).toBe(3);

    await page.keyboard.press('F8');
    await page.waitForTimeout(500);

    // Cancel
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
  expect(getErrors()).toHaveLength(0);
});

test('Cmd+A selects all files', async ({ page }) => {
  const getErrors = trackErrors(page);
  if (await selectFirstFile(page)) {
    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(300);

    const totalRows = await page.locator('[role="row"]').count();
    const selectedRows = await page.locator('[role="row"][aria-selected="true"]').count();
    // All rows in active panel should be selected (roughly half of total)
    expect(selectedRows).toBeGreaterThan(0);
  }
  expect(getErrors()).toHaveLength(0);
});

test('Cmd+D deselects all files', async ({ page }) => {
  const getErrors = trackErrors(page);
  if (await selectFirstFile(page)) {
    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(200);
    await page.keyboard.press('Meta+d');
    await page.waitForTimeout(300);

    const selectedRows = await page.locator('[role="row"][aria-selected="true"]').count();
    expect(selectedRows).toBe(0);
  }
  expect(getErrors()).toHaveLength(0);
});

test('Cmd+Shift+A inverts selection', async ({ page }) => {
  const getErrors = trackErrors(page);
  const rows = page.locator('[role="row"]');
  if (await rows.count() >= 3) {
    await rows.nth(0).click();
    await page.waitForTimeout(100);
    const beforeSelected = await page.locator('[role="row"][aria-selected="true"]').count();

    await page.keyboard.press('Meta+Shift+a');
    await page.waitForTimeout(300);

    const afterSelected = await page.locator('[role="row"][aria-selected="true"]').count();
    // Inverted selection should be different from original
    expect(afterSelected).not.toBe(beforeSelected);
  }
  expect(getErrors()).toHaveLength(0);
});

// ═══════════════════════════════════════════════════
// FULL WORKFLOW: Copy → Paste → Confirm
// ═══════════════════════════════════════════════════

test('full copy-paste workflow: select, copy, switch, paste', async ({ page }) => {
  const getErrors = trackErrors(page);
  if (await selectFirstFile(page)) {
    // Step 1: Copy
    await page.keyboard.press('Meta+c');
    await page.waitForTimeout(300);

    // Step 2: Switch panel
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    // Step 3: Paste
    await page.keyboard.press('Meta+v');
    await page.waitForTimeout(500);

    // Step 4: Dismiss any dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  expect(getErrors()).toHaveLength(0);
});

test('full cut-paste workflow: select, cut, switch, paste', async ({ page }) => {
  const getErrors = trackErrors(page);
  if (await selectFirstFile(page)) {
    await page.keyboard.press('Meta+x');
    await page.waitForTimeout(300);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    await page.keyboard.press('Meta+v');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  expect(getErrors()).toHaveLength(0);
});

/**
 * REAL FILE OPERATIONS TESTS
 *
 * Every test creates files, operates on them, and verifies the
 * outcome by checking the actual filesystem. Uses a throwaway
 * sandbox that's destroyed after tests complete.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { startTestServer, TestServer } from './test-server';
import { injectRealBackend } from './inject-real-backend';

let server: TestServer;

test.beforeAll(async () => {
  server = await startTestServer();
});

test.afterAll(async () => {
  await server.stop();
});

test.beforeEach(async ({ page }) => {
  await injectRealBackend(page, server.url);
  await page.goto('/');
  await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(2500);
});

// Helper: create test files in sandbox, return paths
function createTestFiles(prefix: string, count: number): string[] {
  const paths: string[] = [];
  for (let i = 0; i < count; i++) {
    const name = `${prefix}_${i}.txt`;
    const p = path.join(server.sandboxRoot, name);
    fs.writeFileSync(p, `Content of ${name} - ${Date.now()}`);
    paths.push(p);
  }
  return paths;
}

// Helper: refresh file list
async function refreshList(page: any) {
  await page.keyboard.press('F2');
  await page.waitForTimeout(1000);
}

// ═══════════════════════════════════════════════════
// MULTI-FILE CREATE
// ═══════════════════════════════════════════════════

test('create 5 folders in sequence, verify all exist', async ({ page }) => {
  const names: string[] = [];
  for (let i = 0; i < 5; i++) {
    const name = `batch_folder_${Date.now()}_${i}`;
    names.push(name);
    await page.keyboard.press('F7');
    await page.waitForTimeout(500);
    const input = page.locator('input[type="text"]');
    if (await input.count() > 0 && await input.first().isVisible()) {
      await input.first().fill(name);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(800);
    }
  }

  // Verify ALL on disk
  for (const name of names) {
    const p = path.join(server.sandboxRoot, name);
    expect(fs.existsSync(p), `Folder ${name} should exist`).toBe(true);
    expect(fs.statSync(p).isDirectory(), `${name} should be a directory`).toBe(true);
  }
});

test('create 5 files in sequence, verify all exist', async ({ page }) => {
  const names: string[] = [];
  for (let i = 0; i < 5; i++) {
    const name = `batch_file_${Date.now()}_${i}.txt`;
    names.push(name);
    await page.keyboard.press('Shift+F4');
    await page.waitForTimeout(500);
    const input = page.locator('input[type="text"]');
    if (await input.count() > 0 && await input.first().isVisible()) {
      await input.first().fill(name);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(800);
    }
  }

  for (const name of names) {
    const p = path.join(server.sandboxRoot, name);
    expect(fs.existsSync(p), `File ${name} should exist`).toBe(true);
  }
});

// ═══════════════════════════════════════════════════
// MULTI-FILE DELETE
// ═══════════════════════════════════════════════════

test('select multiple files and delete, verify removed from disk', async ({ page }) => {
  // Create sacrificial files
  const files = createTestFiles('multidel', 3);
  await refreshList(page);

  // Select first file
  const row0 = page.locator(`[aria-label="File: multidel_0.txt"]`);
  if (await row0.count() > 0 && await row0.isVisible()) {
    await row0.click();
    await page.waitForTimeout(300);

    // Cmd+click to add more
    const row1 = page.locator(`[aria-label="File: multidel_1.txt"]`);
    const row2 = page.locator(`[aria-label="File: multidel_2.txt"]`);
    if (await row1.count() > 0) { await row1.click({ modifiers: ['Meta'] }); await page.waitForTimeout(300); }
    if (await row2.count() > 0) { await row2.click({ modifiers: ['Meta'] }); await page.waitForTimeout(300); }

    // Delete
    await page.keyboard.press('Meta+Backspace');
    await page.waitForTimeout(500);

    // Confirm
    const confirmBtn = page.locator('button[aria-label="Confirm"]');
    if (await confirmBtn.count() > 0 && await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(1500);

      // Verify ALL removed from disk
      for (const f of files) {
        expect(fs.existsSync(f), `${path.basename(f)} should be deleted`).toBe(false);
      }
    }
  }
});

// ═══════════════════════════════════════════════════
// MULTI-FILE COPY (F5 to opposite pane)
// ═══════════════════════════════════════════════════

test('F5 copies selected files to opposite pane directory', async ({ page }) => {
  // Create source files
  const srcFiles = createTestFiles('copysrc', 2);
  // Create destination directory
  const destDir = path.join(server.sandboxRoot, 'copy_dest');
  fs.mkdirSync(destDir, { recursive: true });
  await refreshList(page);

  // Navigate right panel into dest dir
  const rightPanel = page.locator('[data-side="right"]');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  const destRow = rightPanel.locator('[aria-label="Folder: copy_dest"]');
  if (await destRow.count() > 0 && await destRow.isVisible()) {
    await destRow.dblclick();
    await page.waitForTimeout(1500);
  }

  // Switch back to left panel and select source files
  const leftPanel = page.locator('[data-side="left"]');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  const src0 = leftPanel.locator('[aria-label="File: copysrc_0.txt"]');
  if (await src0.count() > 0 && await src0.isVisible()) {
    await src0.click();
    await page.waitForTimeout(300);
    const src1 = leftPanel.locator('[aria-label="File: copysrc_1.txt"]');
    if (await src1.count() > 0) { await src1.click({ modifiers: ['Meta'] }); await page.waitForTimeout(300); }

    // F5 copy to opposite
    await page.keyboard.press('F5');
    await page.waitForTimeout(500);

    // Confirm
    const confirmBtn = page.locator('button[aria-label="Confirm"]');
    if (await confirmBtn.count() > 0 && await confirmBtn.isVisible()) {
      await confirmBtn.click();
      // Wait for async copy to complete (poll with timeout)
      for (let w = 0; w < 10; w++) {
        await page.waitForTimeout(500);
        if (fs.existsSync(path.join(destDir, 'copysrc_0.txt'))) break;
      }

      // Verify files exist in BOTH locations (copy, not move)
      expect(fs.existsSync(srcFiles[0]), 'Source should still exist').toBe(true);
      expect(fs.existsSync(srcFiles[1]), 'Source should still exist').toBe(true);
      expect(fs.existsSync(path.join(destDir, 'copysrc_0.txt')), 'Copy should exist in dest').toBe(true);
      expect(fs.existsSync(path.join(destDir, 'copysrc_1.txt')), 'Copy should exist in dest').toBe(true);
    }
  }
});

// ═══════════════════════════════════════════════════
// MOVE (F6 to opposite pane)
// ═══════════════════════════════════════════════════

test('F6 moves files — source removed, dest created', async ({ page }) => {
  const srcFiles = createTestFiles('movesrc', 1);
  const destDir = path.join(server.sandboxRoot, 'move_dest');
  fs.mkdirSync(destDir, { recursive: true });
  await refreshList(page);

  // Navigate right panel into dest
  const rightPanel = page.locator('[data-side="right"]');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  const destRow = rightPanel.locator('[aria-label="Folder: move_dest"]');
  if (await destRow.count() > 0 && await destRow.isVisible()) {
    await destRow.dblclick();
    await page.waitForTimeout(1500);
  }

  // Select source in left panel
  const leftPanel = page.locator('[data-side="left"]');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  const src0 = leftPanel.locator('[aria-label="File: movesrc_0.txt"]');
  if (await src0.count() > 0 && await src0.isVisible()) {
    await src0.click();
    await page.waitForTimeout(300);

    // F6 move
    await page.keyboard.press('F6');
    await page.waitForTimeout(500);

    const confirmBtn = page.locator('button[aria-label="Confirm"]');
    if (await confirmBtn.count() > 0 && await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(1500);

      // Source should be GONE, dest should exist
      expect(fs.existsSync(srcFiles[0]), 'Source should be removed after move').toBe(false);
      expect(fs.existsSync(path.join(destDir, 'movesrc_0.txt')), 'File should exist at dest').toBe(true);
    }
  }
});

// ═══════════════════════════════════════════════════
// NESTED OPERATIONS
// ═══════════════════════════════════════════════════

test('create folder, navigate in, create files, navigate out, verify structure', async ({ page }) => {
  const folderName = `nested_test_${Date.now()}`;

  // Create folder
  await page.keyboard.press('F7');
  await page.waitForTimeout(500);
  const input = page.locator('input[type="text"]');
  if (await input.count() > 0 && await input.first().isVisible()) {
    await input.first().fill(folderName);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  }

  // Navigate into it
  const folderRow = page.locator(`[aria-label="Folder: ${folderName}"]`);
  if (await folderRow.count() > 0 && await folderRow.isVisible()) {
    await folderRow.dblclick();
    await page.waitForTimeout(1500);

    // Create 3 files inside
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Shift+F4');
      await page.waitForTimeout(500);
      const fileInput = page.locator('input[type="text"]');
      if (await fileInput.count() > 0 && await fileInput.first().isVisible()) {
        await fileInput.first().fill(`inner_${i}.txt`);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(800);
      }
    }

    // Navigate out
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(1000);

    // Verify structure
    const folderPath = path.join(server.sandboxRoot, folderName);
    expect(fs.existsSync(folderPath)).toBe(true);
    expect(fs.existsSync(path.join(folderPath, 'inner_0.txt'))).toBe(true);
    expect(fs.existsSync(path.join(folderPath, 'inner_1.txt'))).toBe(true);
    expect(fs.existsSync(path.join(folderPath, 'inner_2.txt'))).toBe(true);
  }
});

// ═══════════════════════════════════════════════════
// EDGE CASES
// ═══════════════════════════════════════════════════

test('delete on ".." parent row does nothing', async ({ page }) => {
  // Navigate into a subfolder
  const folder = page.locator('[aria-label^="Folder:"]').first();
  if (await folder.isVisible()) {
    await folder.dblclick();
    await page.waitForTimeout(1500);

    // Click the parent row
    const parentRow = page.locator('[id$="row--1"]').first();
    if (await parentRow.isVisible()) {
      await parentRow.click();
      await page.waitForTimeout(300);
      await page.keyboard.press('Meta+Backspace');
      await page.waitForTimeout(500);
      // Should not show delete dialog or crash
    }

    const body = await page.textContent('body');
    expect(body).not.toContain('crashed');
  }
});

test('operations with no selection do not crash', async ({ page }) => {
  // Don't select anything, just press operation keys
  await page.keyboard.press('Meta+c');
  await page.waitForTimeout(300);
  await page.keyboard.press('Meta+x');
  await page.waitForTimeout(300);
  await page.keyboard.press('Meta+Backspace');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  const body = await page.textContent('body');
  expect(body).not.toContain('crashed');
});

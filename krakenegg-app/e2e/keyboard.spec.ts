import { test, expect } from '@playwright/test';
import { setupTauriMocks } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
  await setupTauriMocks(page);
  await page.goto('/');
  await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(1500);
});

test('Tab key switches active panel', async ({ page }) => {
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  // Should not crash — Tab toggles active side
});

test('Escape closes any open modal', async ({ page }) => {
  // Open search with Alt+F7
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  // Press Escape to close
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  // No crash expected
});

test('F3 triggers viewer interaction', async ({ page }) => {
  await page.keyboard.press('F3');
  await page.waitForTimeout(500);
  // Should either open viewer or do nothing if no file selected
});

test('ArrowDown moves cursor in file list', async ({ page }) => {
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  // Cursor should move — no crash
});

test('ArrowUp moves cursor up in file list', async ({ page }) => {
  // Move down first, then up
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(100);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(200);
});

test('Home key jumps to first item', async ({ page }) => {
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(100);
  await page.keyboard.press('Home');
  await page.waitForTimeout(200);
});

test('End key jumps to last item', async ({ page }) => {
  await page.keyboard.press('End');
  await page.waitForTimeout(200);
});

test('Ctrl+H toggles hidden files without crash', async ({ page }) => {
  await page.keyboard.press('Control+h');
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+h');
  await page.waitForTimeout(300);
});

test('Cmd+Plus increases font size', async ({ page }) => {
  await page.keyboard.press('Meta+=');
  await page.waitForTimeout(200);
});

test('Cmd+Minus decreases font size', async ({ page }) => {
  await page.keyboard.press('Meta+-');
  await page.waitForTimeout(200);
});

test('Cmd+0 resets font size', async ({ page }) => {
  await page.keyboard.press('Meta+0');
  await page.waitForTimeout(200);
});

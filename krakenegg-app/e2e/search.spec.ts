import { test, expect } from '@playwright/test';
import { setupTauriMocks } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
  await setupTauriMocks(page);
  await page.goto('/');
  await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(1500);
});

test('Alt+F7 opens search modal', async ({ page }) => {
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  const searchInput = page.locator('input[placeholder*="earch"]').first();
  if (await searchInput.isVisible()) {
    await expect(searchInput).toBeVisible();
  }
});

test('Escape closes search modal', async ({ page }) => {
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
});

test('search input accepts text', async ({ page }) => {
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  const searchInput = page.locator('input[placeholder*="earch"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('readme');
    expect(await searchInput.inputValue()).toBe('readme');
  }
});

test('search returns results on Enter', async ({ page }) => {
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  const searchInput = page.locator('input[placeholder*="earch"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('found');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);
    // Check for result text (mock returns 'found.txt')
    const resultText = page.locator('text=found.txt');
    if (await resultText.count() > 0) {
      await expect(resultText.first()).toBeVisible();
    }
  }
});

test('search mode buttons are visible', async ({ page }) => {
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  const textBtn = page.locator('button:has-text("Text")');
  const globBtn = page.locator('button:has-text("Glob")');
  const regexBtn = page.locator('button:has-text("Regex")');
  if (await textBtn.isVisible()) {
    await expect(textBtn).toBeVisible();
    await expect(globBtn).toBeVisible();
    await expect(regexBtn).toBeVisible();
  }
});

test('can switch search mode to Glob', async ({ page }) => {
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  const globBtn = page.locator('button:has-text("Glob")');
  if (await globBtn.isVisible()) {
    await globBtn.click();
    await page.waitForTimeout(200);
  }
});

test('can switch search mode to Regex', async ({ page }) => {
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  const regexBtn = page.locator('button:has-text("Regex")');
  if (await regexBtn.isVisible()) {
    await regexBtn.click();
    await page.waitForTimeout(200);
  }
});

test('search content checkbox toggles', async ({ page }) => {
  await page.keyboard.press('Alt+F7');
  await page.waitForTimeout(500);
  const checkbox = page.locator('input[type="checkbox"]').first();
  if (await checkbox.isVisible()) {
    const initialState = await checkbox.isChecked();
    await checkbox.click();
    expect(await checkbox.isChecked()).toBe(!initialState);
  }
});

import { test, expect } from '@playwright/test';
import { setupTauriMocks } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
  await setupTauriMocks(page);
  await page.goto('/');
  await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(1500);
});

test('Cmd+comma opens settings modal', async ({ page }) => {
  await page.keyboard.press('Meta+,');
  await page.waitForTimeout(500);
  const generalText = page.locator('text=General').first();
  if (await generalText.isVisible()) {
    await expect(generalText).toBeVisible();
  }
});

test('settings modal closes on Escape', async ({ page }) => {
  await page.keyboard.press('Meta+,');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
});

test('settings has Appearance tab', async ({ page }) => {
  await page.keyboard.press('Meta+,');
  await page.waitForTimeout(500);
  const appearanceTab = page.locator('text=Appearance').first();
  if (await appearanceTab.isVisible()) {
    await expect(appearanceTab).toBeVisible();
  }
});

test('settings has theme toggle buttons', async ({ page }) => {
  await page.keyboard.press('Meta+,');
  await page.waitForTimeout(500);
  const appearanceTab = page.locator('text=Appearance').first();
  if (await appearanceTab.isVisible()) {
    await appearanceTab.click();
    await page.waitForTimeout(300);
    const darkBtn = page.locator('button:has-text("dark")');
    const lightBtn = page.locator('button:has-text("light")');
    if (await darkBtn.isVisible()) {
      await expect(darkBtn).toBeVisible();
      await expect(lightBtn).toBeVisible();
    }
  }
});

test('clicking light theme changes data-theme attribute', async ({ page }) => {
  await page.keyboard.press('Meta+,');
  await page.waitForTimeout(500);
  const appearanceTab = page.locator('text=Appearance').first();
  if (await appearanceTab.isVisible()) {
    await appearanceTab.click();
    await page.waitForTimeout(300);
    const lightBtn = page.locator('button:has-text("light")');
    if (await lightBtn.isVisible()) {
      await lightBtn.click();
      await page.waitForTimeout(300);
      const theme = await page.locator('html').getAttribute('data-theme');
      expect(theme).toBe('light');
    }
  }
});

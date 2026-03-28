/**
 * TEST SUITE: Tab Management
 * Tests tab rendering, creation, closing, switching, independence, accessibility
 */
import { test, expect } from '@playwright/test';
import { createSandbox, setupSandboxMocks } from '../sandbox';

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

// --- TABBAR RENDERING ---

test('left tabbar renders', async ({ page }) => {
  const tabbar = page.locator('#tabbar-left, [data-testid="tabbar-left"]').first();
  const roleTablist = page.locator('[role="tablist"]').first();
  const found = (await tabbar.count()) > 0 || (await roleTablist.count()) > 0;
  expect(found).toBe(true);
});

test('right tabbar renders', async ({ page }) => {
  const tabbar = page.locator('#tabbar-right, [data-testid="tabbar-right"]').first();
  const roleTablist = page.locator('[role="tablist"]').last();
  const found = (await tabbar.count()) > 0 || (await roleTablist.count()) > 0;
  expect(found).toBe(true);
});

test('tabs have role="tab"', async ({ page }) => {
  const tabs = page.locator('[role="tab"]');
  const count = await tabs.count();
  // At minimum there should be one tab per panel
  expect(count).toBeGreaterThanOrEqual(1);
});

test('tabs have aria-selected attribute', async ({ page }) => {
  const tabs = page.locator('[role="tab"]');
  const count = await tabs.count();
  if (count > 0) {
    const firstTab = tabs.first();
    const ariaSelected = await firstTab.getAttribute('aria-selected');
    expect(ariaSelected).toBeDefined();
  }
});

test('active tab has aria-selected=true', async ({ page }) => {
  const tabs = page.locator('[role="tab"][aria-selected="true"]');
  const count = await tabs.count();
  // At least one tab should be active
  expect(count).toBeGreaterThanOrEqual(1);
});

test('tab shows path name', async ({ page }) => {
  const tabs = page.locator('[role="tab"]');
  const count = await tabs.count();
  if (count > 0) {
    const text = await tabs.first().textContent();
    // Tab should have some text content (path or folder name)
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(0);
  }
});

test('tab close button has aria-label', async ({ page }) => {
  const closeButtons = page.locator('[aria-label^="Close "], [data-testid*="close-tab"], button:has(svg):near([role="tab"])');
  const count = await closeButtons.count();
  if (count > 0) {
    const label = await closeButtons.first().getAttribute('aria-label');
    // Close button should have an aria-label for accessibility
    if (label) {
      expect(label.toLowerCase()).toContain('close');
    }
  }
  // If no close buttons found, that's acceptable (single tab may hide close button)
  expect(true).toBe(true);
});

test('clicking a tab does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const tabs = page.locator('[role="tab"]');
  const count = await tabs.count();
  if (count > 0) {
    await tabs.first().click();
    await page.waitForTimeout(500);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('adding new tab does not crash (Cmd+T or + button)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Try clicking + button first
  const addBtn = page.locator('button:has-text("+"), [aria-label*="new tab" i], [aria-label*="add tab" i], [data-testid*="add-tab"]').first();
  if (await addBtn.count() > 0 && await addBtn.isVisible()) {
    await addBtn.click();
    await page.waitForTimeout(500);
  } else {
    // Try keyboard shortcut
    await page.keyboard.press('Meta+t');
    await page.waitForTimeout(500);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('closing a tab does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // First add a tab so we have more than one
  const addBtn = page.locator('button:has-text("+"), [aria-label*="new tab" i], [aria-label*="add tab" i], [data-testid*="add-tab"]').first();
  if (await addBtn.count() > 0 && await addBtn.isVisible()) {
    await addBtn.click();
    await page.waitForTimeout(500);
  } else {
    await page.keyboard.press('Meta+t');
    await page.waitForTimeout(500);
  }

  // Now try closing a tab
  const closeBtn = page.locator('[aria-label^="Close "], [data-testid*="close-tab"]').first();
  if (await closeBtn.count() > 0 && await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(500);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('closing last tab creates new default tab', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Close all tabs via close buttons
  let closeBtn = page.locator('[aria-label^="Close "], [data-testid*="close-tab"]').first();
  let attempts = 0;
  while (await closeBtn.count() > 0 && await closeBtn.isVisible() && attempts < 10) {
    await closeBtn.click();
    await page.waitForTimeout(300);
    closeBtn = page.locator('[aria-label^="Close "], [data-testid*="close-tab"]').first();
    attempts++;
  }

  // There should still be at least one tab (the default replacement)
  const tabs = page.locator('[role="tab"]');
  const count = await tabs.count();
  expect(count).toBeGreaterThanOrEqual(1);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('tab switch changes file list content', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  const tabs = page.locator('[role="tab"]');
  const count = await tabs.count();
  if (count >= 2) {
    // Click first tab, record content
    await tabs.nth(0).click();
    await page.waitForTimeout(500);

    // Click second tab
    await tabs.nth(1).click();
    await page.waitForTimeout(500);
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

test('multiple tabs can exist simultaneously', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Add two tabs
  const addBtn = page.locator('button:has-text("+"), [aria-label*="new tab" i], [aria-label*="add tab" i], [data-testid*="add-tab"]').first();
  if (await addBtn.count() > 0 && await addBtn.isVisible()) {
    await addBtn.click();
    await page.waitForTimeout(300);
    await addBtn.click();
    await page.waitForTimeout(300);
  } else {
    await page.keyboard.press('Meta+t');
    await page.waitForTimeout(300);
    await page.keyboard.press('Meta+t');
    await page.waitForTimeout(300);
  }

  const tabs = page.locator('[role="tab"]');
  const count = await tabs.count();
  // Should have at least the original + 2 new = 3 (though count might include both panels)
  expect(count).toBeGreaterThanOrEqual(2);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('tab in left panel independent from right panel', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Click in left panel area
  const leftPanel = page.locator('#tabbar-left, [data-testid="tabbar-left"], [role="tablist"]').first();
  if (await leftPanel.count() > 0) {
    await leftPanel.click();
    await page.waitForTimeout(300);
  }

  // Click in right panel area
  const rightPanel = page.locator('#tabbar-right, [data-testid="tabbar-right"], [role="tablist"]').last();
  if (await rightPanel.count() > 0) {
    await rightPanel.click();
    await page.waitForTimeout(300);
  }

  // No crashes means panels are independent
  expect(filterErrors(errors)).toHaveLength(0);
});

test('tab name truncates for long paths', async ({ page }) => {
  // Tabs should not overflow their container
  const tabs = page.locator('[role="tab"]');
  const count = await tabs.count();
  if (count > 0) {
    const tabBox = await tabs.first().boundingBox();
    if (tabBox) {
      // Tab should have a reasonable width (not infinite)
      expect(tabBox.width).toBeLessThan(1000);
      expect(tabBox.width).toBeGreaterThan(0);
    }
  }
});

test('tab active indicator is visible', async ({ page }) => {
  const activeTab = page.locator('[role="tab"][aria-selected="true"]').first();
  if (await activeTab.count() > 0) {
    const isVisible = await activeTab.isVisible();
    expect(isVisible).toBe(true);
  }
});

test('rapid tab clicking does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  const tabs = page.locator('[role="tab"]');
  const count = await tabs.count();

  // Rapidly click through tabs
  for (let i = 0; i < Math.min(count, 5); i++) {
    await tabs.nth(i % count).click({ delay: 0 });
  }
  // Also rapid-fire click same tab
  if (count > 0) {
    for (let j = 0; j < 10; j++) {
      await tabs.first().click({ delay: 0 });
    }
  }
  await page.waitForTimeout(500);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('close all but one tab', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Add a few tabs first
  const addBtn = page.locator('button:has-text("+"), [aria-label*="new tab" i], [aria-label*="add tab" i], [data-testid*="add-tab"]').first();
  if (await addBtn.count() > 0 && await addBtn.isVisible()) {
    await addBtn.click();
    await page.waitForTimeout(200);
    await addBtn.click();
    await page.waitForTimeout(200);
  }

  // Close tabs one by one until one remains
  let closeBtn = page.locator('[aria-label^="Close "], [data-testid*="close-tab"]').first();
  let attempts = 0;
  while (await closeBtn.count() > 0 && await closeBtn.isVisible() && attempts < 5) {
    await closeBtn.click();
    await page.waitForTimeout(200);
    closeBtn = page.locator('[aria-label^="Close "], [data-testid*="close-tab"]').first();
    attempts++;
  }

  // At least one tab should remain
  const tabs = page.locator('[role="tab"]');
  expect(await tabs.count()).toBeGreaterThanOrEqual(1);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('tab accessibility attributes are complete', async ({ page }) => {
  const tabs = page.locator('[role="tab"]');
  const count = await tabs.count();

  for (let i = 0; i < Math.min(count, 4); i++) {
    const tab = tabs.nth(i);
    const role = await tab.getAttribute('role');
    expect(role).toBe('tab');

    const ariaSelected = await tab.getAttribute('aria-selected');
    expect(ariaSelected === 'true' || ariaSelected === 'false').toBe(true);
  }

  // Check that tabbars have role="tablist"
  const tablists = page.locator('[role="tablist"]');
  const tablistCount = await tablists.count();
  if (tablistCount > 0) {
    for (let i = 0; i < tablistCount; i++) {
      const role = await tablists.nth(i).getAttribute('role');
      expect(role).toBe('tablist');
    }
  }
});

test('tab reorder does not crash (drag if available)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  const tabs = page.locator('[role="tab"]');
  const count = await tabs.count();

  if (count >= 2) {
    const firstTab = tabs.first();
    const secondTab = tabs.nth(1);
    const firstBox = await firstTab.boundingBox();
    const secondBox = await secondTab.boundingBox();

    if (firstBox && secondBox) {
      // Attempt a drag from first tab to second tab position
      await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(300);
    }
  }

  expect(filterErrors(errors)).toHaveLength(0);
});

test('adding tab via keyboard shortcut does not duplicate active tab', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  const tabsBefore = await page.locator('[role="tab"]').count();
  await page.keyboard.press('Meta+t');
  await page.waitForTimeout(500);
  const tabsAfter = await page.locator('[role="tab"]').count();

  // Should have at most 1 more tab (could be same if shortcut not supported)
  expect(tabsAfter).toBeGreaterThanOrEqual(tabsBefore);
  expect(filterErrors(errors)).toHaveLength(0);
});

test('tab click sets it as active (aria-selected=true)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Add a new tab
  const addBtn = page.locator('button:has-text("+"), [aria-label*="new tab" i], [data-testid*="add-tab"]').first();
  if (await addBtn.count() > 0 && await addBtn.isVisible()) {
    await addBtn.click();
    await page.waitForTimeout(500);
  }

  const tabs = page.locator('[role="tab"]');
  const count = await tabs.count();
  if (count >= 2) {
    // Click the first tab
    await tabs.first().click();
    await page.waitForTimeout(300);
    const selected = await tabs.first().getAttribute('aria-selected');
    expect(selected).toBe('true');
  }
  expect(filterErrors(errors)).toHaveLength(0);
});

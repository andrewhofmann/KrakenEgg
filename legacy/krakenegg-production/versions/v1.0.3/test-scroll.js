#!/usr/bin/env node

/**
 * Test scroll functionality in KrakenEgg file list
 * This script opens the app and tests scroll behavior
 */

import puppeteer from 'puppeteer';

async function testScrollFunctionality() {
  console.log('🧪 Testing KrakenEgg scroll functionality...');

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    console.log('📡 Connecting to localhost:3011...');
    await page.goto('http://localhost:3011', { waitUntil: 'networkidle0' });

    // Wait for app to load
    console.log('⏳ Waiting for app to load...');
    await page.waitForSelector('[data-testid="file-list"], .file-row, .ultra-scroll', { timeout: 10000 });

    // Find the scrollable container
    const scrollContainer = await page.$('[data-testid="file-list"]');
    if (!scrollContainer) {
      throw new Error('Scroll container not found');
    }

    console.log('✅ Found scroll container');

    // Test scroll functionality
    console.log('🔍 Testing scroll behavior...');

    // Get initial scroll position
    const initialScroll = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="file-list"]');
      return container ? container.scrollTop : null;
    });

    console.log(`📍 Initial scroll position: ${initialScroll}`);

    // Try scrolling down
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="file-list"]');
      if (container) {
        container.scrollTop = 100;
      }
    });

    // Check if scroll worked
    const newScroll = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="file-list"]');
      return container ? container.scrollTop : null;
    });

    console.log(`📍 New scroll position: ${newScroll}`);

    if (newScroll !== initialScroll) {
      console.log('✅ SCROLL TEST PASSED: Scrolling is working!');
    } else {
      console.log('❌ SCROLL TEST FAILED: Scrolling is not working');
    }

    // Test keyboard navigation scroll
    console.log('⌨️ Testing keyboard navigation scroll...');

    // Focus the file list
    await page.click('[data-testid="file-list"]');

    // Send arrow down keys to trigger scroll
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(50);
    }

    const keyboardScroll = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="file-list"]');
      return container ? container.scrollTop : null;
    });

    console.log(`📍 Keyboard navigation scroll position: ${keyboardScroll}`);

    if (keyboardScroll > newScroll) {
      console.log('✅ KEYBOARD SCROLL TEST PASSED: Keyboard navigation scrolling works!');
    } else {
      console.log('❌ KEYBOARD SCROLL TEST FAILED: Keyboard navigation not scrolling');
    }

    // Final report
    console.log('\n📊 SCROLL TEST SUMMARY:');
    console.log(`   Manual Scroll: ${newScroll !== initialScroll ? 'WORKING ✅' : 'BROKEN ❌'}`);
    console.log(`   Keyboard Scroll: ${keyboardScroll > newScroll ? 'WORKING ✅' : 'BROKEN ❌'}`);

    // Keep browser open for manual testing
    console.log('\n🖥️ Browser kept open for manual testing. Check http://localhost:3011');
    console.log('   Press Ctrl+C to close when done testing.');

    // Keep the script running
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// Run the test
testScrollFunctionality();
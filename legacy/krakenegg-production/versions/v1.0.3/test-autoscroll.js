#!/usr/bin/env node

/**
 * Comprehensive Auto-Scroll Test for KrakenEgg
 * Tests keyboard navigation and auto-scroll functionality with Puppeteer
 */

import puppeteer from 'puppeteer';

async function testAutoScrollFunctionality() {
  console.log('🧪 Testing KrakenEgg Auto-Scroll Functionality...');

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: null
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    console.log('📡 Connecting to localhost:3011...');
    await page.goto('http://localhost:3011', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for app to fully load
    console.log('⏳ Waiting for app to load...');
    await page.waitForSelector('[data-testid="file-list"]', { timeout: 20000 });

    // Give React time to render all files
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('✅ App loaded successfully');

    // Get initial information about the file list
    const initialInfo = await page.evaluate(() => {
      const fileList = document.querySelector('[data-testid="file-list"]');
      const fileRows = document.querySelectorAll('.file-row');

      if (!fileList) {
        throw new Error('File list container not found');
      }

      return {
        containerHeight: fileList.clientHeight,
        containerScrollTop: fileList.scrollTop,
        totalFiles: fileRows.length,
        containerFound: true
      };
    });

    console.log(`📊 Initial State:`);
    console.log(`   Container Height: ${initialInfo.containerHeight}px`);
    console.log(`   Container Scroll: ${initialInfo.containerScrollTop}px`);
    console.log(`   Total Files: ${initialInfo.totalFiles}`);

    if (initialInfo.totalFiles < 10) {
      console.log('⚠️ Warning: Not enough files for comprehensive testing');
    }

    // Focus the file list to enable keyboard navigation
    console.log('🎯 Focusing file list for keyboard navigation...');
    await page.click('[data-testid="file-list"]');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 1: Arrow Down Navigation
    console.log('\n🔽 TEST 1: Arrow Down Navigation (10 steps)');
    for (let i = 0; i < 10; i++) {
      console.log(`   Step ${i + 1}: Arrow Down`);
      await page.keyboard.press('ArrowDown');
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to let scroll happen

      // Check scroll position after each step
      const scrollInfo = await page.evaluate(() => {
        const container = document.querySelector('[data-testid="file-list"]');
        const focusedElement = document.querySelector('.file-row.focused, .file-row[class*="focused"]');
        return {
          scrollTop: container.scrollTop,
          focusedElementFound: !!focusedElement,
          focusedElementIndex: focusedElement ? Array.from(container.querySelectorAll('.file-row')).indexOf(focusedElement) : -1
        };
      });

      console.log(`       Scroll: ${scrollInfo.scrollTop}px, Focused Index: ${scrollInfo.focusedElementIndex}`);
    }

    // Test 2: Page Down Navigation
    console.log('\n📄 TEST 2: Page Down Navigation (3 jumps)');
    for (let i = 0; i < 3; i++) {
      console.log(`   Jump ${i + 1}: Page Down`);
      await page.keyboard.press('PageDown');
      await new Promise(resolve => setTimeout(resolve, 200));

      const scrollInfo = await page.evaluate(() => {
        const container = document.querySelector('[data-testid="file-list"]');
        return {
          scrollTop: container.scrollTop
        };
      });

      console.log(`       Scroll: ${scrollInfo.scrollTop}px`);
    }

    // Test 3: End Key Navigation
    console.log('\n⬇️ TEST 3: End Key Navigation');
    await page.keyboard.press('End');
    await new Promise(resolve => setTimeout(resolve, 300));

    const endScrollInfo = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="file-list"]');
      const focusedElement = document.querySelector('.file-row.focused, .file-row[class*="focused"]');
      return {
        scrollTop: container.scrollTop,
        maxScroll: container.scrollHeight - container.clientHeight,
        focusedElementIndex: focusedElement ? Array.from(container.querySelectorAll('.file-row')).indexOf(focusedElement) : -1
      };
    });

    console.log(`   Final Scroll: ${endScrollInfo.scrollTop}px (Max: ${endScrollInfo.maxScroll}px)`);
    console.log(`   Focused Index: ${endScrollInfo.focusedElementIndex}`);

    // Test 4: Home Key Navigation
    console.log('\n⬆️ TEST 4: Home Key Navigation');
    await page.keyboard.press('Home');
    await new Promise(resolve => setTimeout(resolve, 300));

    const homeScrollInfo = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="file-list"]');
      const focusedElement = document.querySelector('.file-row.focused, .file-row[class*="focused"]');
      return {
        scrollTop: container.scrollTop,
        focusedElementIndex: focusedElement ? Array.from(container.querySelectorAll('.file-row')).indexOf(focusedElement) : -1
      };
    });

    console.log(`   Back to Top Scroll: ${homeScrollInfo.scrollTop}px`);
    console.log(`   Focused Index: ${homeScrollInfo.focusedElementIndex}`);

    // Test 5: Rapid Arrow Down to Test Beyond Visible Area
    console.log('\n🚀 TEST 5: Rapid Navigation Beyond Visible Area (30 steps)');
    const startTime = Date.now();

    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('ArrowDown');
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50)); // Brief pause every 5 steps
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for all scroll operations to complete
    const endTime = Date.now();

    const finalScrollInfo = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="file-list"]');
      const focusedElement = document.querySelector('.file-row.focused, .file-row[class*="focused"]');
      return {
        scrollTop: container.scrollTop,
        maxScroll: container.scrollHeight - container.clientHeight,
        focusedElementIndex: focusedElement ? Array.from(container.querySelectorAll('.file-row')).indexOf(focusedElement) : -1,
        totalFiles: container.querySelectorAll('.file-row').length
      };
    });

    console.log(`   Rapid Navigation Completed in ${endTime - startTime}ms`);
    console.log(`   Final Scroll: ${finalScrollInfo.scrollTop}px`);
    console.log(`   Focused Index: ${finalScrollInfo.focusedElementIndex}/${finalScrollInfo.totalFiles - 1}`);

    // Test Assessment
    console.log('\n📊 AUTO-SCROLL TEST ASSESSMENT:');

    const isScrollWorking = finalScrollInfo.scrollTop > 0;
    const isFocusTracking = finalScrollInfo.focusedElementIndex >= 0;
    const isAtExpectedPosition = finalScrollInfo.focusedElementIndex >= 25; // Should be around 30 steps from start

    console.log(`   ✅ Basic Scrolling: ${isScrollWorking ? 'WORKING' : 'BROKEN'}`);
    console.log(`   ✅ Focus Tracking: ${isFocusTracking ? 'WORKING' : 'BROKEN'}`);
    console.log(`   ✅ Navigation Position: ${isAtExpectedPosition ? 'WORKING' : 'NEEDS CHECKING'}`);

    if (isScrollWorking && isFocusTracking) {
      console.log('\n🎉 AUTO-SCROLL FUNCTIONALITY: WORKING ✅');
    } else {
      console.log('\n❌ AUTO-SCROLL FUNCTIONALITY: ISSUES DETECTED');
    }

    // Check console logs for debug information
    console.log('\n📋 Checking browser console for debug logs...');

    const consoleLogs = await page.evaluate(() => {
      // This will capture any logs that were already written
      return window.__testLogs || [];
    });

    if (consoleLogs.length > 0) {
      console.log('   Found debug logs in browser console');
    } else {
      console.log('   No debug logs captured (check browser DevTools for real-time logs)');
    }

    // Keep browser open for manual inspection
    console.log('\n🖥️ Browser kept open for manual inspection.');
    console.log('   Press Ctrl+C when done testing.');
    console.log('   You can manually test the arrow keys to verify scroll behavior.');

    // Keep the script running
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Auto-scroll test failed:', error.message);

    // Take a screenshot for debugging
    try {
      if (browser) {
        const pages = await browser.pages();
        if (pages.length > 0) {
          await pages[0].screenshot({
            path: 'autoscroll-test-error.png',
            fullPage: true
          });
          console.log('📸 Error screenshot saved as autoscroll-test-error.png');
        }
      }
    } catch (screenshotError) {
      console.log('Could not save screenshot:', screenshotError.message);
    }

    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// Run the test
testAutoScrollFunctionality();
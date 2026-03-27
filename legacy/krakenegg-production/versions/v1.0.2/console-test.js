#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function consoleTest() {
  console.log('🔍 Console logging test...');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    // Listen to console events
    const consoleMessages = [];
    page.on('console', msg => {
      const messageText = msg.text();
      consoleMessages.push(messageText);
      console.log(`🖥️ BROWSER CONSOLE: ${messageText}`);
    });

    // Listen to errors
    page.on('pageerror', error => {
      console.log(`❌ PAGE ERROR: ${error.message}`);
    });

    console.log('📡 Loading localhost:3011...');
    await page.goto('http://localhost:3011', { waitUntil: 'networkidle0' });

    // Wait for React to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(`\n📋 Total console messages: ${consoleMessages.length}`);

    // Look for our debug messages
    const debugMessages = consoleMessages.filter(msg => msg.includes('🔍 UltraFileList render'));
    console.log(`🔍 Debug messages found: ${debugMessages.length}`);

    if (debugMessages.length > 0) {
      console.log('Debug details:', debugMessages[0]);
    }

    // Check if React is actually loaded
    const reactLoaded = await page.evaluate(() => {
      return typeof window.React !== 'undefined' || document.querySelector('[data-reactroot]') !== null;
    });
    console.log(`⚛️ React loaded: ${reactLoaded ? 'YES' : 'NO'}`);

    // Check for any errors
    const errors = consoleMessages.filter(msg => msg.toLowerCase().includes('error'));
    if (errors.length > 0) {
      console.log(`❌ Errors found: ${errors.length}`);
      errors.forEach(error => console.log(`   ${error}`));
    }

    await browser.close();
    console.log('✅ Console test complete');

  } catch (error) {
    console.error('❌ Console test failed:', error.message);
    if (browser) {
      await browser.close();
    }
  }
}

consoleTest();
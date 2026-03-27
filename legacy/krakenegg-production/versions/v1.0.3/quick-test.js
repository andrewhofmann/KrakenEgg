#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function quickTest() {
  console.log('🔍 Quick DOM inspection...');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    console.log('📡 Loading localhost:3011...');
    await page.goto('http://localhost:3011', { waitUntil: 'networkidle0' });

    // Wait a bit for React to render
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check what's on the page
    const bodyText = await page.evaluate(() => document.body.textContent);
    console.log(`📄 Page contains: ${bodyText.substring(0, 100)}...`);

    // Check browser console logs
    const consoleLogs = await page.evaluate(() => {
      const logs = [];
      const originalLog = console.log;
      console.log = function(...args) {
        logs.push(args.join(' '));
        originalLog.apply(console, arguments);
      };
      return logs;
    });
    console.log(`📊 Console logs:`, consoleLogs);

    // Look for our selectors
    const fileListExists = await page.$('[data-testid="file-list"]');
    console.log(`📋 data-testid="file-list": ${fileListExists ? 'FOUND' : 'NOT FOUND'}`);

    const ultraScrollExists = await page.$('.ultra-scroll');
    console.log(`📜 .ultra-scroll: ${ultraScrollExists ? 'FOUND' : 'NOT FOUND'}`);

    const fileRowExists = await page.$('.file-row');
    console.log(`📁 .file-row: ${fileRowExists ? 'FOUND' : 'NOT FOUND'}`);

    // Show all classes on body
    const bodyClasses = await page.evaluate(() => document.body.className);
    console.log(`🏷️ Body classes: ${bodyClasses}`);

    // Look for any divs with scroll classes
    const scrollElements = await page.$$eval('[class*="scroll"]', els =>
      els.map(el => ({ tag: el.tagName, classes: el.className }))
    );
    console.log(`⚡ Scroll elements found:`, scrollElements);

    // Check if there are any file-like elements
    const possibleFileElements = await page.$$eval('[class*="file"]', els =>
      els.map(el => ({ tag: el.tagName, classes: el.className }))
    );
    console.log(`📂 File-like elements:`, possibleFileElements);

    await browser.close();
    console.log('✅ Quick test complete');

  } catch (error) {
    console.error('❌ Quick test failed:', error.message);
    if (browser) {
      await browser.close();
    }
  }
}

quickTest();
import puppeteer from 'puppeteer';

async function testScrolling() {
  console.log('🧪 Testing vertical mouse wheel scrolling fix...');

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true
  });

  const page = await browser.newPage();

  try {
    // Navigate to the app
    await page.goto('http://localhost:3011', { waitUntil: 'networkidle0' });
    console.log('✅ App loaded');

    // Wait for file lists to appear
    await page.waitForSelector('[data-testid="file-list"]', { timeout: 10000 });
    console.log('✅ File lists detected');

    // Test both panels
    const panels = await page.$$('[data-testid="file-list"]');
    console.log(`📋 Found ${panels.length} file list panels`);

    for (let i = 0; i < panels.length; i++) {
      console.log(`\n🔍 Testing panel ${i + 1}:`);

      const panel = panels[i];

      // Check if panel has overflow-y-auto class
      const className = await panel.evaluate(el => el.className);
      console.log(`   CSS classes: ${className}`);

      const hasOverflowAuto = className.includes('overflow-y-auto');
      console.log(`   Has overflow-y-auto: ${hasOverflowAuto ? '✅' : '❌'}`);

      // Check computed styles
      const computedStyle = await panel.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          overflowY: style.overflowY,
          height: style.height,
          maxHeight: style.maxHeight,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight
        };
      });

      console.log(`   Computed overflow-y: ${computedStyle.overflowY}`);
      console.log(`   Height: ${computedStyle.height}`);
      console.log(`   Max height: ${computedStyle.maxHeight}`);
      console.log(`   Scroll height: ${computedStyle.scrollHeight}px`);
      console.log(`   Client height: ${computedStyle.clientHeight}px`);

      const canScroll = computedStyle.scrollHeight > computedStyle.clientHeight;
      console.log(`   Can scroll: ${canScroll ? '✅' : '❌'}`);

      if (canScroll) {
        // Test mouse wheel scrolling
        console.log('   🖱️  Testing mouse wheel scroll...');

        // Get initial scroll position
        const initialScrollTop = await panel.evaluate(el => el.scrollTop);
        console.log(`   Initial scroll position: ${initialScrollTop}`);

        // Simulate mouse wheel down
        await panel.hover();
        await page.mouse.wheel({ deltaY: 100 });
        await page.waitForTimeout(100);

        const scrollTopAfterWheel = await panel.evaluate(el => el.scrollTop);
        console.log(`   Scroll position after wheel: ${scrollTopAfterWheel}`);

        const wheelWorked = scrollTopAfterWheel > initialScrollTop;
        console.log(`   Mouse wheel scroll works: ${wheelWorked ? '✅' : '❌'}`);

        if (wheelWorked) {
          console.log('   🎉 SUCCESS: Vertical mouse wheel scrolling is working!');
        } else {
          console.log('   ❌ FAILED: Vertical mouse wheel scrolling not working');
        }
      } else {
        console.log('   ℹ️  Panel content fits in view - no scrolling needed');
      }
    }

    console.log('\n📊 Test Summary:');
    console.log('- Removed custom onWheel handlers');
    console.log('- Changed from overflow-y-scroll to overflow-y-auto');
    console.log('- Let browser handle scrolling naturally');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testScrolling();
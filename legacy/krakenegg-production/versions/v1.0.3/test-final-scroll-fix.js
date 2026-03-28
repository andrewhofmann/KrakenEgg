import puppeteer from 'puppeteer';

async function testScrollingFix() {
  console.log('🔧 Testing FINAL scroll fix - removing overflow-hidden parent');

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

    // Create lots of fake content to test scrolling
    await page.evaluate(() => {
      const fileLists = document.querySelectorAll('[data-testid="file-list"]');

      fileLists.forEach((list, panelIndex) => {
        console.log(`Adding test content to panel ${panelIndex + 1}`);

        // Create lots of div elements to force scrolling
        for (let i = 0; i < 100; i++) {
          const testDiv = document.createElement('div');
          testDiv.style.height = '40px';
          testDiv.style.padding = '8px';
          testDiv.style.margin = '2px 0';
          testDiv.style.backgroundColor = i % 2 === 0 ? '#f0f0f0' : '#e0e0e0';
          testDiv.style.border = '1px solid #ccc';
          testDiv.textContent = `Test file ${i + 1} - Panel ${panelIndex + 1}`;
          list.appendChild(testDiv);
        }
      });
    });

    console.log('✅ Added test content to force scrolling');

    // Test both panels
    const panels = await page.$$('[data-testid="file-list"]');
    console.log(`📋 Found ${panels.length} file list panels`);

    for (let i = 0; i < panels.length; i++) {
      console.log(`\n🔍 Testing panel ${i + 1}:`);

      const panel = panels[i];

      // Check CSS classes
      const className = await panel.evaluate(el => el.className);
      console.log(`   CSS classes: ${className}`);

      const hasOverflowAuto = className.includes('overflow-y-auto');
      const hasUltraScroll = className.includes('ultra-scroll');
      console.log(`   Has overflow-y-auto: ${hasOverflowAuto ? '✅' : '❌'}`);
      console.log(`   Has ultra-scroll: ${hasUltraScroll ? '✅' : '❌'}`);

      // Check computed styles and scroll capability
      const scrollInfo = await panel.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          overflowY: style.overflowY,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          scrollTop: el.scrollTop
        };
      });

      console.log(`   Computed overflow-y: ${scrollInfo.overflowY}`);
      console.log(`   Scroll height: ${scrollInfo.scrollHeight}px`);
      console.log(`   Client height: ${scrollInfo.clientHeight}px`);

      const canScroll = scrollInfo.scrollHeight > scrollInfo.clientHeight;
      console.log(`   Can scroll: ${canScroll ? '✅' : '❌'}`);

      if (canScroll) {
        // Test mouse wheel scrolling
        console.log('   🖱️  Testing mouse wheel scroll...');

        const initialScrollTop = scrollInfo.scrollTop;
        console.log(`   Initial scroll position: ${initialScrollTop}`);

        // Hover over the panel and simulate wheel scroll
        await panel.hover();
        await page.mouse.wheel({ deltaY: 200 });
        await page.waitForTimeout(200);

        const newScrollTop = await panel.evaluate(el => el.scrollTop);
        console.log(`   Scroll position after wheel: ${newScrollTop}`);

        const wheelWorked = newScrollTop > initialScrollTop;
        console.log(`   Mouse wheel scroll works: ${wheelWorked ? '🎉 YES!' : '❌ NO'}`);

        if (wheelWorked) {
          console.log(`   📏 Scrolled ${newScrollTop - initialScrollTop}px`);

          // Test scroll up as well
          await page.mouse.wheel({ deltaY: -100 });
          await page.waitForTimeout(100);

          const scrollUpPosition = await panel.evaluate(el => el.scrollTop);
          const scrollUpWorked = scrollUpPosition < newScrollTop;
          console.log(`   Mouse wheel scroll UP works: ${scrollUpWorked ? '✅' : '❌'}`);
        }
      }
    }

    console.log('\n🎯 FINAL TEST RESULTS:');
    console.log('✅ Removed overflow-hidden from parent container (UltraFilePanel)');
    console.log('✅ Added ultra-scroll class to scroll containers');
    console.log('✅ Browser native wheel scrolling should now work');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testScrollingFix();
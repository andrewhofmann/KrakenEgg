// JavaScript injection test for scroll functionality
// This can be run in the browser console of the running app

console.log('🧪 KrakenEgg Scroll Test Starting...');

// Test scroll functionality without screenshots
function testScrollFunctionality() {
    const results = [];

    // Find the file list container
    const fileList = document.querySelector('[class*="ultra-scroll"], [class*="overflow-auto"]');
    if (!fileList) {
        results.push('❌ Could not find file list container');
        return results;
    }

    results.push('✅ Found file list container');

    // Check if files are rendered
    const fileRows = fileList.querySelectorAll('[class*="file-row"], .file-row');
    results.push(`📁 Found ${fileRows.length} file rows`);

    if (fileRows.length === 0) {
        results.push('❌ No file rows found');
        return results;
    }

    // Test initial scroll position
    const initialScrollTop = fileList.scrollTop;
    results.push(`📍 Initial scroll position: ${initialScrollTop}`);

    // Test scroll to bottom
    fileList.scrollTop = fileList.scrollHeight;
    const maxScrollTop = fileList.scrollTop;
    results.push(`📍 Max scroll position: ${maxScrollTop}`);

    // Check if we can actually scroll
    if (maxScrollTop > 0) {
        results.push('✅ Scroll functionality working');
    } else {
        results.push('❌ No scrolling possible');
    }

    // Test scroll to middle
    fileList.scrollTop = maxScrollTop / 2;
    const middleScrollTop = fileList.scrollTop;
    results.push(`📍 Middle scroll position: ${middleScrollTop}`);

    // Test focused file highlighting
    const focusedFile = fileList.querySelector('[class*="focused"]');
    if (focusedFile) {
        results.push('✅ Found focused file element');

        // Get focused file position
        const rect = focusedFile.getBoundingClientRect();
        const containerRect = fileList.getBoundingClientRect();
        const isVisible = rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;

        results.push(`🎯 Focused file visible: ${isVisible}`);
        results.push(`📐 Focused file position: top=${rect.top}, bottom=${rect.bottom}`);
        results.push(`📐 Container bounds: top=${containerRect.top}, bottom=${containerRect.bottom}`);
    } else {
        results.push('⚠️ No focused file found');
    }

    // Test keyboard navigation simulation
    const activeElement = document.activeElement;
    results.push(`⌨️ Active element: ${activeElement?.tagName || 'none'}`);

    // Simulate arrow key press
    try {
        const downEvent = new KeyboardEvent('keydown', {
            key: 'ArrowDown',
            keyCode: 40,
            which: 40,
            bubbles: true
        });
        fileList.dispatchEvent(downEvent);
        results.push('✅ Arrow down event dispatched');
    } catch (e) {
        results.push(`❌ Failed to dispatch arrow key: ${e.message}`);
    }

    // Check total scrollable area
    const scrollableHeight = fileList.scrollHeight - fileList.clientHeight;
    results.push(`📏 Total scrollable height: ${scrollableHeight}px`);

    // Test end position accessibility
    fileList.scrollTop = fileList.scrollHeight;
    setTimeout(() => {
        const finalScrollTop = fileList.scrollTop;
        const lastFileRow = fileRows[fileRows.length - 1];

        if (lastFileRow) {
            const lastRect = lastFileRow.getBoundingClientRect();
            const containerRect = fileList.getBoundingClientRect();
            const lastFileVisible = lastRect.bottom <= containerRect.bottom;

            results.push(`🔚 Final scroll position: ${finalScrollTop}`);
            results.push(`🔚 Last file visible: ${lastFileVisible}`);
            results.push(`🔚 Last file bottom: ${lastRect.bottom}, container bottom: ${containerRect.bottom}`);
        }

        // Return to top
        fileList.scrollTop = 0;

        // Display results
        console.log('\n🧪 Scroll Test Results:');
        results.forEach(result => console.log(result));

        // Overall assessment
        const hasScrolling = maxScrollTop > 0;
        const canReachEnd = lastFileVisible;
        const overall = hasScrolling && canReachEnd ? '✅ SCROLL WORKING' : '❌ SCROLL ISSUES';
        console.log(`\n${overall}`);

        // Create summary object
        window.scrollTestResults = {
            hasScrolling,
            canReachEnd,
            maxScrollTop,
            fileCount: fileRows.length,
            scrollableHeight,
            overall: hasScrolling && canReachEnd
        };

    }, 100);

    return results;
}

// Run the test
testScrollFunctionality();

console.log('🧪 Test started - check results above and window.scrollTestResults');
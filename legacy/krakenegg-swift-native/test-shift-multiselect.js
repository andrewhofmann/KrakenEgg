#!/usr/bin/env node

/**
 * KrakenEgg Swift Native - Shift-Hold Multi-Select Test
 *
 * This script tests the shift-hold multi-select functionality specifically
 * by sending keyboard events that simulate holding shift while navigating.
 */

const { execSync, spawn } = require('child_process');

console.log('🔍 KrakenEgg Swift Native - Shift-Hold Multi-Select Test');
console.log('=======================================================');

// Function to send keystroke with shift modifier using AppleScript
function sendShiftKey(keyCode, keyName) {
    try {
        const applescript = `
            tell application "System Events"
                key code ${keyCode} using {shift down}
            end tell
        `;

        console.log(`🎹 Sending Shift+${keyName} key (code: ${keyCode})`);
        execSync(`osascript -e '${applescript}'`, {
            stdio: 'pipe',
            timeout: 5000
        });

        // Wait for the app to process the keystroke
        return new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
        console.error(`❌ Failed to send Shift+${keyName} key:`, error.message);
        return Promise.resolve();
    }
}

// Function to send normal keystroke (without shift)
function sendKey(keyCode, keyName) {
    try {
        const applescript = `
            tell application "System Events"
                key code ${keyCode}
            end tell
        `;

        console.log(`🎹 Sending ${keyName} key (code: ${keyCode})`);
        execSync(`osascript -e '${applescript}'`, {
            stdio: 'pipe',
            timeout: 5000
        });

        return new Promise(resolve => setTimeout(resolve, 600));
    } catch (error) {
        console.error(`❌ Failed to send ${keyName} key:`, error.message);
        return Promise.resolve();
    }
}

// Function to focus the KrakenEgg app
function focusKrakenEgg() {
    try {
        const applescript = `
            tell application "System Events"
                set frontmost of first process whose name is "KrakenEgg" to true
            end tell
        `;

        console.log('🎯 Focusing KrakenEgg application');
        execSync(`osascript -e '${applescript}'`, {
            stdio: 'pipe',
            timeout: 5000
        });
        return true;
    } catch (error) {
        console.error('❌ Failed to focus KrakenEgg:', error.message);
        return false;
    }
}

// Function to check if KrakenEgg is running
function isKrakenEggRunning() {
    try {
        const result = execSync('pgrep -f "KrakenEgg"', {
            stdio: 'pipe',
            encoding: 'utf8'
        });
        return result.trim().length > 0;
    } catch (error) {
        return false;
    }
}

// Main test function for shift-hold multi-select
async function runShiftMultiSelectTest() {
    try {
        console.log('\n📋 Step 1: Checking if KrakenEgg is running...');

        if (!isKrakenEggRunning()) {
            console.log('❌ KrakenEgg is not running. Please start the app first.');
            console.log('   Run: swift run');
            process.exit(1);
        }

        console.log('✅ KrakenEgg is running');

        console.log('\n📋 Step 2: Focusing KrakenEgg application...');
        if (!focusKrakenEgg()) {
            console.log('❌ Failed to focus KrakenEgg. Test cannot continue.');
            process.exit(1);
        }

        // Wait for focus to take effect
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log('\n📋 Step 3: Testing Shift-Hold Multi-Select Functionality...');
        console.log('💡 This test specifically verifies that shift+arrow keys work for multi-selection');

        // Test sequence: Normal navigation, then shift-hold multi-select
        console.log('\n🔄 Phase 1: Initial positioning with normal arrow keys');

        // Move to establish starting position
        await sendKey(126, 'Up Arrow');      // Move up 1
        await sendKey(125, 'Down Arrow');    // Move down 1
        await sendKey(125, 'Down Arrow');    // Move down 1 more (establish position)

        console.log('\n🔄 Phase 2: Shift-hold multi-select test (THE CRITICAL FUNCTIONALITY)');
        console.log('   This should select multiple files while holding shift...');

        // The critical test: Hold shift and navigate to select multiple items
        await sendShiftKey(125, 'Down Arrow');    // Shift+Down: Start multi-select
        await sendShiftKey(125, 'Down Arrow');    // Shift+Down: Extend selection
        await sendShiftKey(125, 'Down Arrow');    // Shift+Down: Extend selection more
        await sendShiftKey(126, 'Up Arrow');      // Shift+Up: Adjust selection back up
        await sendShiftKey(125, 'Down Arrow');    // Shift+Down: Extend again

        console.log('\n🔄 Phase 3: Release shift and navigate normally');
        console.log('   This should clear multi-selection and move normally...');

        // Normal navigation should clear multi-selection
        await sendKey(125, 'Down Arrow');    // Normal down (should clear multi-select)
        await sendKey(126, 'Up Arrow');      // Normal up

        console.log('\n🔄 Phase 4: Another shift-hold sequence');
        console.log('   Testing shift-hold selection in opposite direction...');

        // Test shift-selection going up
        await sendShiftKey(126, 'Up Arrow');      // Shift+Up: Start multi-select upward
        await sendShiftKey(126, 'Up Arrow');      // Shift+Up: Extend selection upward
        await sendShiftKey(125, 'Down Arrow');    // Shift+Down: Adjust selection

        console.log('\n✅ Shift-Hold Multi-Select test sequence completed!');
        console.log('\n📊 Test Summary:');
        console.log('   - Tested normal arrow key navigation (baseline)');
        console.log('   - Tested Shift+Down arrows for downward multi-selection');
        console.log('   - Tested Shift+Up arrows for upward multi-selection');
        console.log('   - Tested releasing shift to clear multi-selection');
        console.log('   - Tested mixed Shift+Up/Down selection adjustments');

        console.log('\n💡 CRITICAL OBSERVATION POINTS:');
        console.log('   1. 🎯 SELECTION HIGHLIGHTING: Multiple files should be highlighted during shift-hold');
        console.log('   2. 🎯 ANCHOR BEHAVIOR: First selected item should remain the anchor point');
        console.log('   3. 🎯 RANGE SELECTION: Continuous range should be selected between anchor and cursor');
        console.log('   4. 🎯 CLEAR ON RELEASE: Multi-selection should clear when shift is released');
        console.log('   5. 🎯 VISUAL FEEDBACK: Selected files should have different visual styling');

        console.log('\n❗ EXPECTED BEHAVIOR:');
        console.log('   - If multi-selection is working: You should see MULTIPLE files highlighted');
        console.log('   - If still broken: Only ONE file will be highlighted, same as normal navigation');

        // Final status check
        console.log('\n📋 Step 4: Final application status check...');
        if (isKrakenEggRunning()) {
            console.log('✅ KrakenEgg is still running after tests');
        } else {
            console.log('❌ KrakenEgg crashed during testing');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Main execution
if (require.main === module) {
    console.log('🚀 Starting shift-hold multi-select test...\n');
    runShiftMultiSelectTest().catch(error => {
        console.error('💥 Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { runShiftMultiSelectTest, sendShiftKey, sendKey, focusKrakenEgg, isKrakenEggRunning };
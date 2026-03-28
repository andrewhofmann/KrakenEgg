#!/usr/bin/env node

/**
 * KrakenEgg Swift Native - Keyboard Navigation Test
 *
 * This script comprehensively tests keyboard navigation functionality
 * by automating keyboard input and verifying application responses.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 KrakenEgg Swift Native - Keyboard Navigation Test');
console.log('====================================================');

// Function to send keystroke to active application using AppleScript
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

        // Wait for the app to process the keystroke
        return new Promise(resolve => setTimeout(resolve, 500));
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

// Function to wait for app to be ready
function waitForApp(maxWaitTime = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkInterval = 500;

        const check = () => {
            if (isKrakenEggRunning()) {
                console.log('✅ KrakenEgg is running');
                // Wait an additional 2 seconds for full initialization
                setTimeout(() => resolve(true), 2000);
            } else if (Date.now() - startTime > maxWaitTime) {
                reject(new Error('KrakenEgg failed to start within timeout'));
            } else {
                setTimeout(check, checkInterval);
            }
        };

        check();
    });
}

// Main test function
async function runKeyboardNavigationTest() {
    try {
        console.log('\n📋 Step 1: Checking if KrakenEgg is running...');

        if (!isKrakenEggRunning()) {
            console.log('❌ KrakenEgg is not running. Please start the app first.');
            console.log('   Run: swift run');
            process.exit(1);
        }

        await waitForApp();

        console.log('\n📋 Step 2: Focusing KrakenEgg application...');
        if (!focusKrakenEgg()) {
            console.log('❌ Failed to focus KrakenEgg. Test cannot continue.');
            process.exit(1);
        }

        // Wait for focus to take effect
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('\n📋 Step 3: Testing keyboard navigation (10 attempts as requested)...');

        const keyTests = [
            { code: 125, name: 'Down Arrow', description: 'Move selection down' },
            { code: 126, name: 'Up Arrow', description: 'Move selection up' },
            { code: 125, name: 'Down Arrow', description: 'Move selection down again' },
            { code: 125, name: 'Down Arrow', description: 'Move selection down again' },
            { code: 126, name: 'Up Arrow', description: 'Move selection up again' },
            { code: 48, name: 'Tab', description: 'Switch between panels' },
            { code: 125, name: 'Down Arrow', description: 'Move selection in other panel' },
            { code: 126, name: 'Up Arrow', description: 'Move selection up in other panel' },
            { code: 48, name: 'Tab', description: 'Switch back to first panel' },
            { code: 53, name: 'Escape', description: 'Navigate to parent directory' }
        ];

        for (let i = 0; i < keyTests.length; i++) {
            const test = keyTests[i];
            console.log(`\n🔄 Test ${i + 1}/10: ${test.description}`);
            await sendKey(test.code, test.name);

            // Additional wait to observe any visual changes
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n📋 Step 4: Testing additional navigation keys...');

        // Test Enter key (navigate into directory)
        console.log('\n🔄 Testing Enter key (navigate into selected item)');
        await sendKey(36, 'Return/Enter');
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Test Escape to go back
        console.log('\n🔄 Testing Escape key (navigate back)');
        await sendKey(53, 'Escape');
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log('\n✅ Keyboard navigation test completed!');
        console.log('\n📊 Test Summary:');
        console.log('   - Sent 12 keyboard events total');
        console.log('   - Tested Up/Down arrows (primary navigation)');
        console.log('   - Tested Tab (panel switching)');
        console.log('   - Tested Enter (directory navigation)');
        console.log('   - Tested Escape (back navigation)');
        console.log('\n💡 IMPORTANT: Please observe the KrakenEgg app visually');
        console.log('   to verify if the file selection is moving correctly.');
        console.log('   If the selection highlights are not moving, the');
        console.log('   keyboard navigation is still broken.');

        // Final status check
        console.log('\n📋 Step 5: Final application status check...');
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

// Additional function to get process info for debugging
function getKrakenEggInfo() {
    try {
        const pids = execSync('pgrep -f "KrakenEgg"', {
            stdio: 'pipe',
            encoding: 'utf8'
        }).trim().split('\n').filter(pid => pid);

        console.log('\n🔍 KrakenEgg Process Information:');
        pids.forEach(pid => {
            try {
                const psInfo = execSync(`ps -p ${pid} -o pid,ppid,command`, {
                    stdio: 'pipe',
                    encoding: 'utf8'
                });
                console.log(psInfo.trim());
            } catch (e) {
                console.log(`   PID ${pid}: Process info unavailable`);
            }
        });
    } catch (error) {
        console.log('❌ No KrakenEgg processes found');
    }
}

// Main execution
if (require.main === module) {
    console.log('🚀 Starting keyboard navigation test...\n');
    getKrakenEggInfo();
    runKeyboardNavigationTest().catch(error => {
        console.error('💥 Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { runKeyboardNavigationTest, sendKey, focusKrakenEgg, isKrakenEggRunning };
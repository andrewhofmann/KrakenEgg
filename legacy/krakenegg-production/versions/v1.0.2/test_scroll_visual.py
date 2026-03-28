#!/usr/bin/env python3
"""
Visual testing script for KrakenEgg scroll functionality.
Uses AppleScript to send keystrokes and take screenshots for visual verification.
"""

import subprocess
import time
import os

def execute_applescript(script):
    """Execute AppleScript command."""
    try:
        result = subprocess.run(['osascript', '-e', script],
                              capture_output=True, text=True, timeout=10)
        return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
    except subprocess.TimeoutExpired:
        return False, "", "Timeout"
    except Exception as e:
        return False, "", str(e)

def take_screenshot(filename):
    """Take a screenshot of the KrakenEgg window."""
    script = f'''
    tell application "System Events"
        tell application "KrakenEgg" to activate
        delay 0.5
        do shell script "screencapture -l$(osascript -e 'tell app \\"KrakenEgg\\" to id of window 1') {filename}"
    end tell
    '''
    return execute_applescript(script)

def send_key_to_app(key_code, modifiers=""):
    """Send a key to the KrakenEgg application."""
    modifier_str = f"using {{{modifiers}}}" if modifiers else ""
    script = f'''
    tell application "System Events"
        tell application "KrakenEgg" to activate
        delay 0.2
        key code {key_code} {modifier_str}
        delay 0.3
    end tell
    '''
    return execute_applescript(script)

def focus_on_file_list():
    """Click on the file list to ensure it has focus."""
    script = '''
    tell application "System Events"
        tell application "KrakenEgg" to activate
        delay 0.5
        click at {600, 400}
        delay 0.3
    end tell
    '''
    return execute_applescript(script)

def test_keyboard_navigation():
    """Test keyboard navigation and visual feedback."""
    print("🧪 Starting KrakenEgg scroll visual testing...")

    # Create test directory
    test_dir = "/tmp/krakenegg_visual_test"
    os.makedirs(test_dir, exist_ok=True)

    # Wait for app to be ready
    print("⏳ Waiting for app to be ready...")
    time.sleep(2)

    # Take initial screenshot
    print("📸 Taking initial screenshot...")
    take_screenshot(f"{test_dir}/01_initial.png")

    # Focus on file list
    print("🎯 Focusing on file list...")
    focus_on_file_list()
    time.sleep(0.5)

    # Take screenshot after focus
    take_screenshot(f"{test_dir}/02_focused.png")

    # Test arrow down navigation (multiple times)
    print("⬇️ Testing down arrow navigation...")
    for i in range(10):
        print(f"  Down arrow #{i+1}")
        send_key_to_app("125")  # Down arrow key code
        time.sleep(0.2)

    # Take screenshot after down navigation
    take_screenshot(f"{test_dir}/03_after_down.png")

    # Test arrow up navigation
    print("⬆️ Testing up arrow navigation...")
    for i in range(5):
        print(f"  Up arrow #{i+1}")
        send_key_to_app("126")  # Up arrow key code
        time.sleep(0.2)

    # Take screenshot after up navigation
    take_screenshot(f"{test_dir}/04_after_up.png")

    # Test Page Down
    print("📄 Testing Page Down...")
    send_key_to_app("121")  # Page Down key code
    time.sleep(0.5)
    take_screenshot(f"{test_dir}/05_after_pagedown.png")

    # Test Page Up
    print("📄 Testing Page Up...")
    send_key_to_app("116")  # Page Up key code
    time.sleep(0.5)
    take_screenshot(f"{test_dir}/06_after_pageup.png")

    # Test End key (Cmd+Down)
    print("🔚 Testing End key (Cmd+Down)...")
    send_key_to_app("125", "command down")  # Cmd+Down
    time.sleep(0.5)
    take_screenshot(f"{test_dir}/07_after_end.png")

    # Test Home key (Cmd+Up)
    print("🏠 Testing Home key (Cmd+Up)...")
    send_key_to_app("126", "command down")  # Cmd+Up
    time.sleep(0.5)
    take_screenshot(f"{test_dir}/08_after_home.png")

    print(f"✅ Visual testing complete! Screenshots saved to: {test_dir}")
    print(f"📂 Use 'open {test_dir}' to view screenshots")

    # Open the folder with screenshots
    subprocess.run(['open', test_dir])

if __name__ == "__main__":
    test_keyboard_navigation()
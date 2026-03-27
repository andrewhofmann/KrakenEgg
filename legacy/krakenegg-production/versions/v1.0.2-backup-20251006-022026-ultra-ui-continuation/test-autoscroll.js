#!/usr/bin/env node

/**
 * Comprehensive Auto-Scroll Testing Framework for KrakenEgg
 * This script creates a test environment to thoroughly validate the auto-scroll behavior
 * before passing it to the user for manual testing.
 */

import fs from 'fs';
import path from 'path';

// Test Configuration
const TEST_DIR = '/tmp/krakenegg-test-dir';
const NUM_TEST_FILES = 200; // Create enough files to require scrolling

class AutoScrollTester {
  constructor() {
    this.testResults = [];
    this.setupComplete = false;
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type}: ${message}`;
    console.log(logMessage);
    this.testResults.push({ timestamp, type, message });
  }

  async setupTestEnvironment() {
    this.log('🚀 Setting up auto-scroll test environment...');

    try {
      // Create test directory
      if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
      }
      fs.mkdirSync(TEST_DIR, { recursive: true });

      // Create many test files to ensure scrolling is needed
      this.log(`📁 Creating ${NUM_TEST_FILES} test files...`);
      for (let i = 1; i <= NUM_TEST_FILES; i++) {
        const fileName = `test-file-${i.toString().padStart(3, '0')}.txt`;
        const filePath = path.join(TEST_DIR, fileName);
        fs.writeFileSync(filePath, `Test file ${i} content\nThis file is for testing auto-scroll functionality.\nFile index: ${i}`);
      }

      // Create some directories too
      const subDirs = ['folder-a', 'folder-b', 'folder-c', 'folder-d', 'folder-e'];
      subDirs.forEach((dir, index) => {
        const dirPath = path.join(TEST_DIR, dir);
        fs.mkdirSync(dirPath);
        // Add some files in subdirectories
        for (let i = 1; i <= 10; i++) {
          const fileName = `sub-file-${i}.txt`;
          const filePath = path.join(dirPath, fileName);
          fs.writeFileSync(filePath, `Subdirectory file ${i} in ${dir}`);
        }
      });

      this.log(`✅ Created ${NUM_TEST_FILES} test files and ${subDirs.length} subdirectories`);
      this.setupComplete = true;

    } catch (error) {
      this.log(`❌ Failed to setup test environment: ${error.message}`, 'ERROR');
      return false;
    }

    return true;
  }

  analyzeVirtualScrollImplementation() {
    this.log('🔍 Analyzing virtual scroll implementation...');

    const hookPath = './src/hooks/useVirtualScroll.ts';
    const listPath = './src/components/panels/UltraFileList.tsx';

    try {
      // Check if files exist
      if (!fs.existsSync(hookPath)) {
        this.log(`❌ Virtual scroll hook not found at ${hookPath}`, 'ERROR');
        return false;
      }

      if (!fs.existsSync(listPath)) {
        this.log(`❌ File list component not found at ${listPath}`, 'ERROR');
        return false;
      }

      // Analyze the hook implementation
      const hookContent = fs.readFileSync(hookPath, 'utf8');
      const listContent = fs.readFileSync(listPath, 'utf8');

      // Check for key functionality
      const checks = [
        {
          name: 'scrollToIndex function exists',
          test: hookContent.includes('const scrollToIndex = useCallback'),
          critical: true
        },
        {
          name: 'scrollToIndex accepts behavior parameter',
          test: hookContent.includes('behavior: \'auto\' | \'smooth\' = \'auto\''),
          critical: true
        },
        {
          name: 'Buffer zone calculation exists',
          test: hookContent.includes('bufferSize = itemHeight'),
          critical: true
        },
        {
          name: 'needsScroll logic implemented',
          test: hookContent.includes('const needsScroll ='),
          critical: true
        },
        {
          name: 'Debug logging present',
          test: hookContent.includes('console.log'),
          critical: false
        },
        {
          name: 'Keyboard navigation calls scrollToIndex',
          test: listContent.includes('scrollToIndex(newIndex'),
          critical: true
        },
        {
          name: 'Interface properly typed',
          test: hookContent.includes('scrollToIndex: (index: number, behavior?: \'auto\' | \'smooth\') => void'),
          critical: true
        }
      ];

      let criticalIssues = 0;
      let totalIssues = 0;

      checks.forEach(check => {
        if (check.test) {
          this.log(`✅ ${check.name}`, 'PASS');
        } else {
          this.log(`❌ ${check.name}`, 'FAIL');
          totalIssues++;
          if (check.critical) criticalIssues++;
        }
      });

      if (criticalIssues > 0) {
        this.log(`❌ ${criticalIssues} critical issues found in implementation`, 'ERROR');
        return false;
      }

      if (totalIssues > 0) {
        this.log(`⚠️ ${totalIssues} non-critical issues found`, 'WARN');
      } else {
        this.log('✅ All implementation checks passed', 'PASS');
      }

      return true;

    } catch (error) {
      this.log(`❌ Failed to analyze implementation: ${error.message}`, 'ERROR');
      return false;
    }
  }

  generateTestPlan() {
    this.log('📋 Generating comprehensive test plan...');

    const testPlan = {
      setup: [
        '1. Open KrakenEgg application',
        `2. Navigate to test directory: ${TEST_DIR}`,
        '3. Ensure file list is visible and populated',
        '4. Open browser developer tools (Cmd+Option+I)',
        '5. Switch to Console tab to monitor debug output'
      ],

      keyboardTests: [
        {
          name: 'Down Arrow Navigation',
          steps: [
            'Click on first file to focus',
            'Press Down Arrow key repeatedly (10-15 times)',
            'Verify: Selection cursor moves down',
            'Verify: List auto-scrolls to keep selection visible',
            'Verify: Console shows scrollToIndex debug output'
          ],
          expected: 'Selection stays visible, list scrolls smoothly downward'
        },
        {
          name: 'Up Arrow Navigation',
          steps: [
            'Navigate to middle of list (around file 100)',
            'Press Up Arrow key repeatedly (10-15 times)',
            'Verify: Selection cursor moves up',
            'Verify: List auto-scrolls to keep selection visible',
            'Verify: Console shows scrollToIndex debug output'
          ],
          expected: 'Selection stays visible, list scrolls smoothly upward'
        },
        {
          name: 'Page Down Navigation',
          steps: [
            'Start at top of list',
            'Press Page Down key',
            'Verify: Selection jumps down a full page',
            'Verify: List scrolls to show new selection',
            'Verify: Console shows scrollToIndex debug output'
          ],
          expected: 'Large jump scrolling works correctly'
        },
        {
          name: 'Page Up Navigation',
          steps: [
            'Navigate to bottom of list',
            'Press Page Up key',
            'Verify: Selection jumps up a full page',
            'Verify: List scrolls to show new selection',
            'Verify: Console shows scrollToIndex debug output'
          ],
          expected: 'Large jump scrolling works correctly'
        },
        {
          name: 'Home/End Navigation',
          steps: [
            'Press End key to go to last file',
            'Verify: List scrolls to bottom, last file selected',
            'Press Home key to go to first file',
            'Verify: List scrolls to top, first file selected'
          ],
          expected: 'Extreme navigation works correctly'
        }
      ],

      edgeCases: [
        {
          name: 'Rapid Navigation',
          test: 'Hold down arrow key for continuous navigation',
          expected: 'Scrolling keeps up with rapid selection changes'
        },
        {
          name: 'Container Resize',
          test: 'Resize window while navigating',
          expected: 'Auto-scroll adapts to new container dimensions'
        },
        {
          name: 'Mixed Navigation',
          test: 'Combine arrow keys, page keys, and mouse clicks',
          expected: 'All navigation methods trigger appropriate scrolling'
        }
      ],

      debugAnalysis: [
        'Monitor console for scrollToIndex function calls',
        'Verify calculations are correct (itemTop, itemBottom, etc.)',
        'Check needsScroll logic triggers appropriately',
        'Confirm scroll commands are executed',
        'Validate no JavaScript errors occur'
      ]
    };

    this.log('📝 Test plan generated with:');
    this.log(`   - ${testPlan.keyboardTests.length} keyboard navigation tests`);
    this.log(`   - ${testPlan.edgeCases.length} edge case tests`);
    this.log(`   - ${testPlan.debugAnalysis.length} debug verification points`);

    return testPlan;
  }

  generateTestReport() {
    this.log('📊 Generating test report...');

    const report = {
      timestamp: new Date().toISOString(),
      testEnvironment: {
        testDirectory: TEST_DIR,
        fileCount: NUM_TEST_FILES,
        setupComplete: this.setupComplete
      },
      recommendations: [
        'Run all keyboard navigation tests systematically',
        'Pay special attention to console debug output',
        'Test with different window sizes',
        'Verify smooth scrolling behavior',
        'Check for any performance issues with large file lists'
      ],
      testResults: this.testResults
    };

    const reportPath = path.join(TEST_DIR, 'auto-scroll-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log(`📄 Test report saved to: ${reportPath}`);
    return report;
  }

  async runTests() {
    this.log('🧪 Starting comprehensive auto-scroll testing framework...');

    // Setup test environment
    const setupSuccess = await this.setupTestEnvironment();
    if (!setupSuccess) {
      this.log('❌ Cannot proceed without proper test environment', 'ERROR');
      return false;
    }

    // Analyze implementation
    const analysisSuccess = this.analyzeVirtualScrollImplementation();
    if (!analysisSuccess) {
      this.log('❌ Critical implementation issues found', 'ERROR');
      return false;
    }

    // Generate test plan
    const testPlan = this.generateTestPlan();

    // Generate report
    const report = this.generateTestReport();

    this.log('✅ Testing framework setup complete!');
    this.log('');
    this.log('🎯 NEXT STEPS:');
    this.log('1. Start KrakenEgg application');
    this.log(`2. Navigate to: ${TEST_DIR}`);
    this.log('3. Open Developer Tools (Cmd+Option+I) → Console tab');
    this.log('4. Execute the test plan systematically');
    this.log('5. Monitor console output for debug information');
    this.log('');
    this.log('🔍 KEY THINGS TO VERIFY:');
    this.log('- Selection cursor stays visible during navigation');
    this.log('- List auto-scrolls smoothly');
    this.log('- Console shows detailed scrollToIndex debug output');
    this.log('- No JavaScript errors occur');
    this.log('- Performance remains smooth with 200+ files');

    return true;
  }
}

// Run the testing framework
const tester = new AutoScrollTester();
tester.runTests().then(success => {
  if (success) {
    console.log('\n🚀 Ready for manual testing! Start the KrakenEgg app now.');
    process.exit(0);
  } else {
    console.log('\n❌ Testing framework setup failed.');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Testing framework crashed:', error);
  process.exit(1);
});
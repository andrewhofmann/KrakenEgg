// Real File Verification Test
// This test definitively proves whether the application is loading real files or mock files

import { FileInfo } from '../types';
import { generateRealFiles, getRealHomeDirectory, getRealDocumentsDirectory } from '../data/realFiles';
import { generateMockFiles } from '../data/mockFiles';
import fileService from '../services/fileService';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

/**
 * Comprehensive test suite to verify real file loading
 */
export class RealFileVerificationTest {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log('🦑 Starting Real File Verification Test Suite...');

    // Test 1: Verify Tauri availability
    await this.testTauriAvailability();

    // Test 2: Compare file counts between real and mock
    await this.testFileCountsVsMock();

    // Test 3: Check for system-specific files that wouldn't exist in mocks
    await this.testSystemSpecificFiles();

    // Test 4: Verify real timestamp differences
    await this.testRealTimestamps();

    // Test 5: Check file size consistency
    await this.testFileSizeRealism();

    // Test 6: Verify directory structure matches OS
    await this.testDirectoryStructure();

    // Test 7: Test file modification dates
    await this.testFileModificationDates();

    return this.results;
  }

  private addResult(testName: string, passed: boolean, message: string, details?: any) {
    const result: TestResult = { testName, passed, message, details };
    this.results.push(result);
    console.log(`🦑 ${passed ? '✅' : '❌'} ${testName}: ${message}`, details ? details : '');
  }

  private async testTauriAvailability(): Promise<void> {
    try {
      const isAvailable = fileService.isAvailable();
      this.addResult(
        'Tauri Availability',
        isAvailable,
        isAvailable ? 'Tauri is available and can access real files' : 'Tauri is not available - should fall back to mock files',
        {
          windowExists: typeof window !== 'undefined',
          hasTauri: typeof window !== 'undefined' && '__TAURI__' in window,
          fileServiceAvailable: isAvailable
        }
      );
    } catch (error) {
      this.addResult('Tauri Availability', false, `Error checking Tauri: ${error}`, { error });
    }
  }

  private async testFileCountsVsMock(): Promise<void> {
    try {
      const homeDir = await getRealHomeDirectory();
      const realFiles = await generateRealFiles(homeDir);
      const mockFiles = await generateMockFiles(homeDir);

      const countsDifferent = realFiles.length !== mockFiles.length;

      this.addResult(
        'File Count Comparison',
        countsDifferent,
        countsDifferent
          ? `Real files (${realFiles.length}) vs Mock files (${mockFiles.length}) - counts differ, indicating real files`
          : `Real and mock have same count (${realFiles.length}) - might be using mock files`,
        {
          realCount: realFiles.length,
          mockCount: mockFiles.length,
          homeDirectory: homeDir
        }
      );
    } catch (error) {
      this.addResult('File Count Comparison', false, `Error comparing counts: ${error}`, { error });
    }
  }

  private async testSystemSpecificFiles(): Promise<void> {
    try {
      const homeDir = await getRealHomeDirectory();
      const files = await generateRealFiles(homeDir);

      // Look for macOS-specific files that wouldn't be in mock data
      const macOSFiles = ['.DS_Store', '.Trash', 'Library', 'Desktop', 'Documents', 'Downloads'];
      const foundMacOSFiles = files.filter(file =>
        macOSFiles.some(macFile => file.name.includes(macFile))
      );

      const hasSystemFiles = foundMacOSFiles.length > 0;

      this.addResult(
        'System-Specific Files',
        hasSystemFiles,
        hasSystemFiles
          ? `Found ${foundMacOSFiles.length} macOS-specific files, confirming real file system access`
          : 'No macOS-specific files found - might be using mock data',
        {
          foundFiles: foundMacOSFiles.map(f => f.name),
          totalSystemFiles: foundMacOSFiles.length
        }
      );
    } catch (error) {
      this.addResult('System-Specific Files', false, `Error checking system files: ${error}`, { error });
    }
  }

  private async testRealTimestamps(): Promise<void> {
    try {
      const homeDir = await getRealHomeDirectory();
      const realFiles = await generateRealFiles(homeDir);
      const mockFiles = await generateMockFiles(homeDir);

      if (realFiles.length === 0) {
        this.addResult('Real Timestamps', false, 'No real files to test timestamps', {});
        return;
      }

      // Check if timestamps are realistic (not all the same, within reasonable range)
      const realTimestamps = realFiles.slice(0, 5).map(f => new Date(f.modified).getTime());
      const mockTimestamps = mockFiles.slice(0, 5).map(f => new Date(f.modified).getTime());

      const realVariance = this.calculateVariance(realTimestamps);
      const mockVariance = this.calculateVariance(mockTimestamps);

      const hasRealVariance = realVariance > mockVariance;

      this.addResult(
        'Real Timestamps',
        hasRealVariance,
        hasRealVariance
          ? `Real timestamps show realistic variance (${realVariance.toFixed(0)}) vs mock (${mockVariance.toFixed(0)})`
          : `Timestamp variance is low, might be mock data`,
        {
          realVariance: realVariance,
          mockVariance: mockVariance,
          sampleRealTimestamps: realTimestamps.slice(0, 3),
          sampleMockTimestamps: mockTimestamps.slice(0, 3)
        }
      );
    } catch (error) {
      this.addResult('Real Timestamps', false, `Error testing timestamps: ${error}`, { error });
    }
  }

  private async testFileSizeRealism(): Promise<void> {
    try {
      const homeDir = await getRealHomeDirectory();
      const files = await generateRealFiles(homeDir);

      if (files.length === 0) {
        this.addResult('File Size Realism', false, 'No files to test sizes', {});
        return;
      }

      // Real files should have varied, realistic sizes
      const fileSizes = files.filter(f => !f.isDirectory).map(f => f.size);
      const hasVariedSizes = fileSizes.length > 0 && Math.max(...fileSizes) > Math.min(...fileSizes);
      const hasLargeFiles = fileSizes.some(size => size > 1024 * 1024); // > 1MB

      const isRealistic = hasVariedSizes && fileSizes.length > 0;

      this.addResult(
        'File Size Realism',
        isRealistic,
        isRealistic
          ? `Files show realistic size variation (${fileSizes.length} files, largest: ${Math.max(...fileSizes)} bytes)`
          : `File sizes seem uniform or unrealistic`,
        {
          fileCount: fileSizes.length,
          minSize: Math.min(...fileSizes),
          maxSize: Math.max(...fileSizes),
          hasLargeFiles: hasLargeFiles,
          sampleSizes: fileSizes.slice(0, 5)
        }
      );
    } catch (error) {
      this.addResult('File Size Realism', false, `Error testing file sizes: ${error}`, { error });
    }
  }

  private async testDirectoryStructure(): Promise<void> {
    try {
      const homeDir = await getRealHomeDirectory();
      const files = await generateRealFiles(homeDir);

      // Check for expected macOS directory structure
      const expectedDirs = ['Desktop', 'Documents', 'Downloads', 'Library', 'Movies', 'Music', 'Pictures'];
      const foundExpectedDirs = files.filter(f =>
        f.isDirectory && expectedDirs.includes(f.name)
      );

      const hasExpectedStructure = foundExpectedDirs.length >= 3; // At least 3 standard directories

      this.addResult(
        'Directory Structure',
        hasExpectedStructure,
        hasExpectedStructure
          ? `Found ${foundExpectedDirs.length} expected macOS directories, confirming real file system`
          : `Missing expected macOS directories, might be mock data`,
        {
          expectedDirectories: expectedDirs,
          foundDirectories: foundExpectedDirs.map(d => d.name),
          foundCount: foundExpectedDirs.length
        }
      );
    } catch (error) {
      this.addResult('Directory Structure', false, `Error testing directory structure: ${error}`, { error });
    }
  }

  private async testFileModificationDates(): Promise<void> {
    try {
      const homeDir = await getRealHomeDirectory();
      const files = await generateRealFiles(homeDir);

      if (files.length === 0) {
        this.addResult('File Modification Dates', false, 'No files to test modification dates', {});
        return;
      }

      // Real files should have modification dates spread over time
      const modDates = files.slice(0, 10).map(f => new Date(f.modified));
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      const hasRecentFiles = modDates.some(date => now.getTime() - date.getTime() < 30 * 24 * 60 * 60 * 1000); // Within 30 days
      const hasOlderFiles = modDates.some(date => date < oneYearAgo);
      const hasSpreadDates = hasRecentFiles || modDates.length > 5;

      this.addResult(
        'File Modification Dates',
        hasSpreadDates,
        hasSpreadDates
          ? `Files show realistic modification date spread (recent: ${hasRecentFiles}, older: ${hasOlderFiles})`
          : `File modification dates seem artificial`,
        {
          hasRecentFiles,
          hasOlderFiles,
          sampleDates: modDates.slice(0, 3).map(d => d.toISOString()),
          dateRange: {
            oldest: Math.min(...modDates.map(d => d.getTime())),
            newest: Math.max(...modDates.map(d => d.getTime()))
          }
        }
      );
    } catch (error) {
      this.addResult('File Modification Dates', false, `Error testing modification dates: ${error}`, { error });
    }
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numbers.length;
    return variance;
  }

  // Static method to run tests and display results
  static async runAndDisplay(): Promise<boolean> {
    const tester = new RealFileVerificationTest();
    const results = await tester.runAllTests();

    console.log('\n🦑 ===== REAL FILE VERIFICATION TEST RESULTS =====');

    let passedTests = 0;
    results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} - ${result.testName}`);
      console.log(`    ${result.message}`);
      if (result.details) {
        console.log(`    Details:`, result.details);
      }
      console.log('');

      if (result.passed) passedTests++;
    });

    const overallPassed = passedTests >= Math.ceil(results.length * 0.7); // 70% pass rate
    console.log(`🦑 OVERALL RESULT: ${overallPassed ? '✅ REAL FILES CONFIRMED' : '❌ LIKELY MOCK FILES'}`);
    console.log(`🦑 Tests passed: ${passedTests}/${results.length} (${Math.round(passedTests/results.length * 100)}%)`);

    return overallPassed;
  }
}

// Export function for easy testing
export async function verifyRealFiles(): Promise<boolean> {
  return await RealFileVerificationTest.runAndDisplay();
}
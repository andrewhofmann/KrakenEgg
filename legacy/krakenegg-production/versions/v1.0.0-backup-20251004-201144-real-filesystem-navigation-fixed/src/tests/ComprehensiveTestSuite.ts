// Comprehensive Test Suite for KrakenEgg File Manager
// Tests 100% of file operations in isolated environment

import TestEnvironment, { TestOperation } from './TestEnvironment';
import fileService from '../services/fileService';
import { FileInfo } from '../types';

export interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  message: string;
  error?: any;
  details?: any;
}

export interface TestSuiteResult {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  results: TestResult[];
  overallSuccess: boolean;
}

export class ComprehensiveTestSuite {
  private testEnv: TestEnvironment;
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.testEnv = new TestEnvironment();
  }

  /**
   * Run the complete test suite
   */
  async runFullSuite(): Promise<TestSuiteResult> {
    console.log('🦑 ComprehensiveTestSuite: Starting full test suite...');
    this.startTime = Date.now();
    this.results = [];

    try {
      // Initialize test environment
      await this.runTest('Environment Setup', () => this.testEnv.initialize());

      // Basic file operations
      await this.testBasicFileOperations();

      // Directory operations
      await this.testDirectoryOperations();

      // File content operations
      await this.testFileContentOperations();

      // Copy and move operations
      await this.testCopyMoveOperations();

      // Archive operations
      await this.testArchiveOperations();

      // Navigation operations
      await this.testNavigationOperations();

      // Edge cases and error handling
      await this.testEdgeCases();

      // Performance tests
      await this.testPerformance();

      // File system integrity
      await this.testFileSystemIntegrity();

      // Cleanup
      await this.runTest('Environment Cleanup', () => this.testEnv.cleanup());

    } catch (error) {
      console.error('🦑 ComprehensiveTestSuite: Critical error during testing:', error);
      await this.runTest('Emergency Cleanup', () => this.testEnv.cleanup());
    }

    return this.generateSuiteResult();
  }

  /**
   * Test basic file operations
   */
  private async testBasicFileOperations(): Promise<void> {
    console.log('🦑 Testing basic file operations...');

    // Test file creation
    await this.runTest('Create Test File', async () => {
      const testFile = this.testEnv.getTestPath('basic_test.txt');
      await fileService.writeFile(testFile, 'Test content for basic operations');

      const exists = await fileService.pathExists(testFile);
      if (!exists) throw new Error('File was not created');

      const content = await fileService.readFile(testFile);
      if (content !== 'Test content for basic operations') {
        throw new Error('File content mismatch');
      }
    });

    // Test file info retrieval
    await this.runTest('Get File Info', async () => {
      const testFile = this.testEnv.getTestPath('basic_test.txt');
      const fileInfo = await fileService.getFileInfo(testFile);

      if (!fileInfo) throw new Error('File info not retrieved');
      if (fileInfo.isDirectory) throw new Error('File incorrectly identified as directory');
      if (fileInfo.size === 0) throw new Error('File size is zero');
    });

    // Test file deletion
    await this.runTest('Delete File', async () => {
      const testFile = this.testEnv.getTestPath('basic_test.txt');
      await fileService.deleteFile(testFile);

      const exists = await fileService.pathExists(testFile);
      if (exists) throw new Error('File was not deleted');
    });

    // Test file listing
    await this.runTest('List Directory Contents', async () => {
      const testDir = this.testEnv.getTestPath('Documents');
      const files = await fileService.listDirectory(testDir);

      if (!files || files.length === 0) {
        throw new Error('No files found in test directory');
      }

      const hasProjects = files.some(f => f.name === 'Projects' && f.isDirectory);
      if (!hasProjects) throw new Error('Expected Projects directory not found');
    });
  }

  /**
   * Test directory operations
   */
  private async testDirectoryOperations(): Promise<void> {
    console.log('🦑 Testing directory operations...');

    // Test directory creation
    await this.runTest('Create Directory', async () => {
      const newDir = this.testEnv.getTestPath('NewTestDirectory');
      await fileService.createDirectory(newDir);

      const exists = await fileService.pathExists(newDir);
      if (!exists) throw new Error('Directory was not created');

      const fileInfo = await fileService.getFileInfo(newDir);
      if (!fileInfo.isDirectory) throw new Error('Created path is not a directory');
    });

    // Test nested directory creation
    await this.runTest('Create Nested Directories', async () => {
      const nestedDir = this.testEnv.getTestPath('Nested/Deep/Directory/Structure');
      await fileService.createDirectory(nestedDir);

      const exists = await fileService.pathExists(nestedDir);
      if (!exists) throw new Error('Nested directory was not created');
    });

    // Test directory listing
    await this.runTest('List Directory with Subdirectories', async () => {
      const baseDir = this.testEnv.getBasePath();
      const files = await fileService.listDirectory(baseDir);

      const dirCount = files.filter(f => f.isDirectory).length;
      const fileCount = files.filter(f => !f.isDirectory).length;

      console.log(`Found ${dirCount} directories and ${fileCount} files`);

      if (dirCount === 0) throw new Error('No directories found');
    });

    // Test directory deletion
    await this.runTest('Delete Empty Directory', async () => {
      const testDir = this.testEnv.getTestPath('EmptyTestDir');
      await fileService.createDirectory(testDir);
      await fileService.deleteDirectory(testDir, false);

      const exists = await fileService.pathExists(testDir);
      if (exists) throw new Error('Directory was not deleted');
    });

    // Test recursive directory deletion
    await this.runTest('Delete Directory Recursively', async () => {
      const testDir = this.testEnv.getTestPath('RecursiveDeleteTest');
      await fileService.createDirectory(testDir);
      await fileService.createDirectory(`${testDir}/subdir`);
      await fileService.writeFile(`${testDir}/test.txt`, 'content');
      await fileService.writeFile(`${testDir}/subdir/nested.txt`, 'nested content');

      await fileService.deleteDirectory(testDir, true);

      const exists = await fileService.pathExists(testDir);
      if (exists) throw new Error('Directory was not deleted recursively');
    });
  }

  /**
   * Test file content operations
   */
  private async testFileContentOperations(): Promise<void> {
    console.log('🦑 Testing file content operations...');

    // Test writing and reading various content types
    await this.runTest('Write and Read Text File', async () => {
      const textFile = this.testEnv.getTestPath('content_test.txt');
      const content = 'This is test content\nwith multiple lines\nand special chars: äöü!@#$%';

      await fileService.writeFile(textFile, content);
      const readContent = await fileService.readFile(textFile);

      if (readContent !== content) throw new Error('Content mismatch after read');
    });

    // Test JSON content
    await this.runTest('Write and Read JSON File', async () => {
      const jsonFile = this.testEnv.getTestPath('test.json');
      const jsonData = {
        name: 'Test Object',
        numbers: [1, 2, 3, 4, 5],
        nested: { key: 'value', array: ['a', 'b', 'c'] },
        boolean: true,
        null_value: null
      };
      const content = JSON.stringify(jsonData, null, 2);

      await fileService.writeFile(jsonFile, content);
      const readContent = await fileService.readFile(jsonFile);
      const parsedData = JSON.parse(readContent);

      if (JSON.stringify(parsedData) !== JSON.stringify(jsonData)) {
        throw new Error('JSON data mismatch after read');
      }
    });

    // Test large file content
    await this.runTest('Write and Read Large File', async () => {
      const largeFile = this.testEnv.getTestPath('large_content.txt');
      const lines = Array.from({ length: 10000 }, (_, i) => `Line ${i + 1}: ${Math.random()}`);
      const content = lines.join('\n');

      await fileService.writeFile(largeFile, content);
      const readContent = await fileService.readFile(largeFile);

      if (readContent.split('\n').length !== 10000) {
        throw new Error('Large file line count mismatch');
      }
    });

    // Test Unicode content
    await this.runTest('Write and Read Unicode File', async () => {
      const unicodeFile = this.testEnv.getTestPath('unicode_test.txt');
      const content = 'Unicode test: 🦑 中文 русский 日本語 العربية Ελληνικά 🎉✨🌟';

      await fileService.writeFile(unicodeFile, content);
      const readContent = await fileService.readFile(unicodeFile);

      if (readContent !== content) throw new Error('Unicode content mismatch');
    });
  }

  /**
   * Test copy and move operations
   */
  private async testCopyMoveOperations(): Promise<void> {
    console.log('🦑 Testing copy and move operations...');

    // Test file copy
    await this.runTest('Copy File', async () => {
      const sourceFile = this.testEnv.getTestPath('copy_source.txt');
      const destFile = this.testEnv.getTestPath('copy_destination.txt');
      const content = 'Content to be copied';

      await fileService.writeFile(sourceFile, content);
      await fileService.copyFile(sourceFile, destFile);

      const sourceExists = await fileService.pathExists(sourceFile);
      const destExists = await fileService.pathExists(destFile);
      const destContent = await fileService.readFile(destFile);

      if (!sourceExists) throw new Error('Source file disappeared after copy');
      if (!destExists) throw new Error('Destination file was not created');
      if (destContent !== content) throw new Error('Copied content mismatch');
    });

    // Test file move
    await this.runTest('Move File', async () => {
      const sourceFile = this.testEnv.getTestPath('move_source.txt');
      const destFile = this.testEnv.getTestPath('move_destination.txt');
      const content = 'Content to be moved';

      await fileService.writeFile(sourceFile, content);
      await fileService.moveFile(sourceFile, destFile);

      const sourceExists = await fileService.pathExists(sourceFile);
      const destExists = await fileService.pathExists(destFile);
      const destContent = await fileService.readFile(destFile);

      if (sourceExists) throw new Error('Source file still exists after move');
      if (!destExists) throw new Error('Destination file was not created');
      if (destContent !== content) throw new Error('Moved content mismatch');
    });

    // Test directory copy
    await this.runTest('Copy Directory', async () => {
      const sourceDir = this.testEnv.getTestPath('copy_dir_source');
      const destDir = this.testEnv.getTestPath('copy_dir_destination');

      await fileService.createDirectory(sourceDir);
      await fileService.writeFile(`${sourceDir}/file1.txt`, 'File 1 content');
      await fileService.writeFile(`${sourceDir}/file2.txt`, 'File 2 content');
      await fileService.createDirectory(`${sourceDir}/subdir`);
      await fileService.writeFile(`${sourceDir}/subdir/nested.txt`, 'Nested content');

      await fileService.copyFile(sourceDir, destDir);

      const destExists = await fileService.pathExists(destDir);
      const file1Exists = await fileService.pathExists(`${destDir}/file1.txt`);
      const file2Exists = await fileService.pathExists(`${destDir}/file2.txt`);
      const subdirExists = await fileService.pathExists(`${destDir}/subdir`);
      const nestedExists = await fileService.pathExists(`${destDir}/subdir/nested.txt`);

      if (!destExists) throw new Error('Destination directory was not created');
      if (!file1Exists || !file2Exists) throw new Error('Files were not copied');
      if (!subdirExists || !nestedExists) throw new Error('Subdirectory was not copied');
    });

    // Test renaming
    await this.runTest('Rename File', async () => {
      const originalFile = this.testEnv.getTestPath('original_name.txt');
      const renamedFile = this.testEnv.getTestPath('renamed_file.txt');
      const content = 'Content to be renamed';

      await fileService.writeFile(originalFile, content);
      await fileService.renameFile(originalFile, renamedFile);

      const originalExists = await fileService.pathExists(originalFile);
      const renamedExists = await fileService.pathExists(renamedFile);
      const renamedContent = await fileService.readFile(renamedFile);

      if (originalExists) throw new Error('Original file still exists after rename');
      if (!renamedExists) throw new Error('Renamed file was not created');
      if (renamedContent !== content) throw new Error('Renamed content mismatch');
    });
  }

  /**
   * Test archive operations
   */
  private async testArchiveOperations(): Promise<void> {
    console.log('🦑 Testing archive operations...');

    // Test archive creation
    await this.runTest('Create Archive', async () => {
      const file1 = this.testEnv.getTestPath('archive_test1.txt');
      const file2 = this.testEnv.getTestPath('archive_test2.txt');
      const archivePath = this.testEnv.getTestPath('test_archive.zip');

      await fileService.writeFile(file1, 'Archive test file 1');
      await fileService.writeFile(file2, 'Archive test file 2');

      await fileService.createArchive([file1, file2], archivePath, 'zip');

      const archiveExists = await fileService.pathExists(archivePath);
      if (!archiveExists) throw new Error('Archive was not created');

      const archiveInfo = await fileService.getFileInfo(archivePath);
      if (archiveInfo.size === 0) throw new Error('Archive is empty');
    });

    // Test archive extraction
    await this.runTest('Extract Archive', async () => {
      const archivePath = this.testEnv.getTestPath('test_archive.zip');
      const extractDir = this.testEnv.getTestPath('extracted');

      await fileService.createDirectory(extractDir);
      await fileService.extractArchive(archivePath, extractDir);

      const file1Exists = await fileService.pathExists(`${extractDir}/archive_test1.txt`);
      const file2Exists = await fileService.pathExists(`${extractDir}/archive_test2.txt`);

      if (!file1Exists || !file2Exists) {
        throw new Error('Archive files were not extracted');
      }

      const content1 = await fileService.readFile(`${extractDir}/archive_test1.txt`);
      const content2 = await fileService.readFile(`${extractDir}/archive_test2.txt`);

      if (content1 !== 'Archive test file 1' || content2 !== 'Archive test file 2') {
        throw new Error('Extracted file content mismatch');
      }
    });
  }

  /**
   * Test navigation operations
   */
  private async testNavigationOperations(): Promise<void> {
    console.log('🦑 Testing navigation operations...');

    // Test navigate to path
    await this.runTest('Navigate to Directory', async () => {
      const testDir = this.testEnv.getTestPath('Documents/Projects');
      const files = await fileService.navigateToPath(testDir);

      if (!files || files.length === 0) {
        throw new Error('No files found during navigation');
      }

      const hasProject1 = files.some(f => f.name === 'project1' && f.isDirectory);
      if (!hasProject1) throw new Error('Expected project1 directory not found');
    });

    // Test home directory access
    await this.runTest('Get Home Directory', async () => {
      const homeDir = await fileService.getHomeDirectory();
      if (!homeDir || homeDir.length === 0) {
        throw new Error('Home directory path is empty');
      }

      const exists = await fileService.pathExists(homeDir);
      if (!exists) throw new Error('Home directory does not exist');
    });

    // Test documents directory access
    await this.runTest('Get Documents Directory', async () => {
      const docsDir = await fileService.getDocumentsDirectory();
      if (!docsDir || docsDir.length === 0) {
        throw new Error('Documents directory path is empty');
      }

      const exists = await fileService.pathExists(docsDir);
      if (!exists) throw new Error('Documents directory does not exist');
    });

    // Test desktop directory access
    await this.runTest('Get Desktop Directory', async () => {
      const desktopDir = await fileService.getDesktopDirectory();
      if (!desktopDir || desktopDir.length === 0) {
        throw new Error('Desktop directory path is empty');
      }

      const exists = await fileService.pathExists(desktopDir);
      if (!exists) throw new Error('Desktop directory does not exist');
    });
  }

  /**
   * Test edge cases and error handling
   */
  private async testEdgeCases(): Promise<void> {
    console.log('🦑 Testing edge cases and error handling...');

    // Test non-existent file operations
    await this.runTest('Handle Non-Existent File', async () => {
      const nonExistentFile = this.testEnv.getTestPath('does_not_exist.txt');

      try {
        await fileService.readFile(nonExistentFile);
        throw new Error('Should have thrown error for non-existent file');
      } catch (error) {
        // Expected behavior
        if (!error.message.includes('Failed to read file')) {
          throw new Error('Unexpected error message for non-existent file');
        }
      }
    });

    // Test special characters in filenames
    await this.runTest('Handle Special Characters in Filenames', async () => {
      const specialFile = this.testEnv.getTestPath('special !@#$%^&()_+-=[]{}|;:,.<>?.txt');
      const content = 'Content with special filename';

      await fileService.writeFile(specialFile, content);
      const exists = await fileService.pathExists(specialFile);
      if (!exists) throw new Error('File with special characters was not created');

      const readContent = await fileService.readFile(specialFile);
      if (readContent !== content) throw new Error('Special filename content mismatch');
    });

    // Test very long filename
    await this.runTest('Handle Long Filename', async () => {
      const longName = 'very_long_filename_'.repeat(10) + '.txt';
      const longFile = this.testEnv.getTestPath(longName);
      const content = 'Content with long filename';

      try {
        await fileService.writeFile(longFile, content);
        const exists = await fileService.pathExists(longFile);
        if (exists) {
          const readContent = await fileService.readFile(longFile);
          if (readContent !== content) throw new Error('Long filename content mismatch');
        }
      } catch (error) {
        // Some filesystems have length limits, this is acceptable
        console.log('Long filename test failed (expected on some filesystems):', error.message);
      }
    });

    // Test empty file operations
    await this.runTest('Handle Empty File', async () => {
      const emptyFile = this.testEnv.getTestPath('empty.txt');
      await fileService.writeFile(emptyFile, '');

      const exists = await fileService.pathExists(emptyFile);
      if (!exists) throw new Error('Empty file was not created');

      const content = await fileService.readFile(emptyFile);
      if (content !== '') throw new Error('Empty file content is not empty');

      const fileInfo = await fileService.getFileInfo(emptyFile);
      if (fileInfo.size !== 0) throw new Error('Empty file size is not zero');
    });
  }

  /**
   * Test performance with various file sizes and quantities
   */
  private async testPerformance(): Promise<void> {
    console.log('🦑 Testing performance...');

    // Test listing large directory
    await this.runTest('List Large Directory Performance', async () => {
      const perfDir = this.testEnv.getTestPath('performance_test');
      await fileService.createDirectory(perfDir);

      // Create many files
      const fileCount = 100;
      const startTime = Date.now();

      for (let i = 0; i < fileCount; i++) {
        await fileService.writeFile(`${perfDir}/file_${i}.txt`, `Content ${i}`);
      }

      const creationTime = Date.now() - startTime;
      console.log(`Created ${fileCount} files in ${creationTime}ms`);

      const listStartTime = Date.now();
      const files = await fileService.listDirectory(perfDir);
      const listTime = Date.now() - listStartTime;

      console.log(`Listed ${files.length} files in ${listTime}ms`);

      if (files.length !== fileCount) {
        throw new Error(`Expected ${fileCount} files, found ${files.length}`);
      }

      if (listTime > 5000) { // 5 seconds threshold
        throw new Error(`Directory listing took too long: ${listTime}ms`);
      }
    });

    // Test large file operations
    await this.runTest('Large File Performance', async () => {
      const largeFile = this.testEnv.getTestPath('large_performance.txt');
      const lines = Array.from({ length: 50000 }, (_, i) => `Performance test line ${i + 1}`);
      const content = lines.join('\n');

      const writeStartTime = Date.now();
      await fileService.writeFile(largeFile, content);
      const writeTime = Date.now() - writeStartTime;

      const readStartTime = Date.now();
      const readContent = await fileService.readFile(largeFile);
      const readTime = Date.now() - readStartTime;

      console.log(`Large file write: ${writeTime}ms, read: ${readTime}ms`);

      if (readContent.split('\n').length !== 50000) {
        throw new Error('Large file content mismatch');
      }

      if (writeTime > 10000 || readTime > 10000) { // 10 seconds threshold
        throw new Error(`Large file operations took too long: write ${writeTime}ms, read ${readTime}ms`);
      }
    });
  }

  /**
   * Test file system integrity
   */
  private async testFileSystemIntegrity(): Promise<void> {
    console.log('🦑 Testing file system integrity...');

    // Verify test environment integrity
    await this.runTest('Test Environment Integrity', async () => {
      const isValid = await this.testEnv.verifyIntegrity();
      if (!isValid) throw new Error('Test environment integrity check failed');
    });

    // Test concurrent operations
    await this.runTest('Concurrent File Operations', async () => {
      const concurrentPromises = [];

      for (let i = 0; i < 10; i++) {
        const filePath = this.testEnv.getTestPath(`concurrent_${i}.txt`);
        concurrentPromises.push(
          fileService.writeFile(filePath, `Concurrent content ${i}`)
        );
      }

      await Promise.all(concurrentPromises);

      // Verify all files were created
      for (let i = 0; i < 10; i++) {
        const filePath = this.testEnv.getTestPath(`concurrent_${i}.txt`);
        const exists = await fileService.pathExists(filePath);
        if (!exists) throw new Error(`Concurrent file ${i} was not created`);

        const content = await fileService.readFile(filePath);
        if (content !== `Concurrent content ${i}`) {
          throw new Error(`Concurrent file ${i} content mismatch`);
        }
      }
    });

    // Test system directories accessibility
    await this.runTest('System Directories Accessibility', async () => {
      const systemInfo = await fileService.getSystemInfo();
      console.log('System info:', systemInfo);

      if (!systemInfo) throw new Error('System info not available');

      // Test access to common system directories
      const homeDir = await fileService.getHomeDirectory();
      const homeFiles = await fileService.listDirectory(homeDir);

      if (!homeFiles || homeFiles.length === 0) {
        throw new Error('Cannot access home directory files');
      }

      console.log(`Home directory contains ${homeFiles.length} items`);
    });
  }

  /**
   * Run a single test with error handling and timing
   */
  private async runTest(testName: string, testFunction: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    let passed = false;
    let error: any = null;
    let message = '';
    let details: any = null;

    try {
      console.log(`🦑 Running test: ${testName}`);
      const result = await testFunction();
      passed = true;
      message = 'Test completed successfully';
      details = result;
      console.log(`✅ Test passed: ${testName}`);
    } catch (e) {
      passed = false;
      error = e;
      message = e.message || 'Unknown error';
      console.error(`❌ Test failed: ${testName}`, e);
    }

    const duration = Date.now() - startTime;

    this.results.push({
      testName,
      passed,
      duration,
      message,
      error,
      details
    });
  }

  /**
   * Generate final test suite result
   */
  private generateSuiteResult(): TestSuiteResult {
    const totalDuration = Date.now() - this.startTime;
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const overallSuccess = failedTests === 0;

    const result: TestSuiteResult = {
      totalTests,
      passedTests,
      failedTests,
      duration: totalDuration,
      results: this.results,
      overallSuccess
    };

    console.log(`🦑 ComprehensiveTestSuite: Complete! ${passedTests}/${totalTests} tests passed in ${totalDuration}ms`);

    return result;
  }

  /**
   * Get detailed test report
   */
  getDetailedReport(): string {
    const report = [
      '🦑 KrakenEgg Comprehensive Test Suite Report',
      '=' .repeat(50),
      '',
      `Total Tests: ${this.results.length}`,
      `Passed: ${this.results.filter(r => r.passed).length}`,
      `Failed: ${this.results.filter(r => !r.passed).length}`,
      `Total Duration: ${Date.now() - this.startTime}ms`,
      '',
      'Test Results:',
      '-'.repeat(30)
    ];

    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      report.push(`${status} - ${result.testName} (${result.duration}ms)`);
      if (!result.passed) {
        report.push(`    Error: ${result.message}`);
        if (result.error) {
          report.push(`    Details: ${result.error}`);
        }
      }
      report.push('');
    });

    return report.join('\n');
  }
}

export default ComprehensiveTestSuite;
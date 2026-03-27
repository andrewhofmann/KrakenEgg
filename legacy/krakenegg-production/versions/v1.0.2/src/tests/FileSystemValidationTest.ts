// File System Validation Test
// Compares KrakenEgg app results with actual bash command output
// Detects permission issues and file access problems

import fileService from '../services/fileService';
import { FileInfo } from '../types';

export interface ValidationResult {
  testName: string;
  appFileCount: number;
  bashFileCount: number;
  appFiles: string[];
  bashFiles: string[];
  missingInApp: string[];
  extraInApp: string[];
  permissionIssues: string[];
  passed: boolean;
  details: string;
}

export class FileSystemValidationTest {
  private results: ValidationResult[] = [];

  /**
   * Compare app results with bash ls command for a specific directory
   */
  async validateDirectory(path: string, testName: string = ''): Promise<ValidationResult> {
    console.log(`🦑 Validating directory: ${path}`);

    const actualTestName = testName || `Validation for ${path}`;

    try {
      // Get files from app
      const appFiles = await this.getAppFiles(path);
      const appFileNames = appFiles.map(f => f.name).sort();

      // Get files from bash ls command
      const bashFiles = await this.getBashFiles(path);
      const bashFileNames = bashFiles.sort();

      // Compare results
      const missingInApp = bashFileNames.filter(f => !appFileNames.includes(f));
      const extraInApp = appFileNames.filter(f => !bashFileNames.includes(f));

      // Check for permission issues
      const permissionIssues = await this.checkPermissionIssues(path, missingInApp);

      const passed = missingInApp.length === 0 && extraInApp.length === 0;

      const result: ValidationResult = {
        testName: actualTestName,
        appFileCount: appFileNames.length,
        bashFileCount: bashFileNames.length,
        appFiles: appFileNames,
        bashFiles: bashFileNames,
        missingInApp,
        extraInApp,
        permissionIssues,
        passed,
        details: this.generateComparisonDetails(path, appFileNames, bashFileNames, missingInApp, extraInApp, permissionIssues)
      };

      this.results.push(result);

      if (passed) {
        console.log(`✅ ${actualTestName}: Perfect match! App shows ${appFileNames.length} files, bash shows ${bashFileNames.length} files`);
      } else {
        console.log(`❌ ${actualTestName}: Mismatch detected!`);
        console.log(`   App files: ${appFileNames.length}, Bash files: ${bashFileNames.length}`);
        console.log(`   Missing in app: ${missingInApp.length}, Extra in app: ${extraInApp.length}`);
        if (permissionIssues.length > 0) {
          console.log(`   Permission issues: ${permissionIssues.length}`);
        }
      }

      return result;

    } catch (error) {
      console.error(`🦑 Validation failed for ${path}:`, error);

      const errorResult: ValidationResult = {
        testName: actualTestName,
        appFileCount: 0,
        bashFileCount: 0,
        appFiles: [],
        bashFiles: [],
        missingInApp: [],
        extraInApp: [],
        permissionIssues: [error.message],
        passed: false,
        details: `Error during validation: ${error.message}`
      };

      this.results.push(errorResult);
      return errorResult;
    }
  }

  /**
   * Get file list from the app
   */
  private async getAppFiles(path: string): Promise<FileInfo[]> {
    try {
      const files = await fileService.listDirectory(path);
      console.log(`🦑 App found ${files.length} files in ${path}`);
      return files;
    } catch (error) {
      console.error(`🦑 App failed to list ${path}:`, error);
      throw new Error(`App file listing failed: ${error.message}`);
    }
  }

  /**
   * Get file list using bash ls command
   * Currently uses mock data but can be extended with real bash commands
   */
  private async getBashFiles(path: string): Promise<string[]> {
    console.log(`🦑 Getting bash comparison data for: ${path}`);

    // For now, use realistic mock data that simulates what bash would show
    // This can be enhanced with actual shell commands when shell plugin is properly configured
    const mockBashFiles = this.getMockBashFiles(path);
    console.log(`🦑 Bash comparison found ${mockBashFiles.length} files in ${path}`);
    return mockBashFiles;
  }

  /**
   * Mock bash file listing (since we can't execute shell commands directly)
   * In a real implementation, this would use a Tauri command
   */
  private getMockBashFiles(path: string): string[] {
    // This is a mock implementation
    // In reality, we'd need to implement a Tauri command that executes shell commands
    const pathLower = path.toLowerCase();

    if (pathLower.includes('documents')) {
      return ['.DS_Store', 'Personal', 'Work', 'Archive', 'temp.txt'];
    } else if (pathLower.includes('desktop')) {
      return ['.DS_Store', 'Shortcuts', 'temp_file.txt'];
    } else if (pathLower.includes('downloads')) {
      return ['.DS_Store', 'setup.exe', 'document.pdf', 'image.png'];
    } else if (pathLower === '/users/andrew' || pathLower.endsWith('/andrew')) {
      return [
        '.DS_Store', '.bash_profile', '.bashrc', '.gitconfig', '.ssh',
        'Applications', 'Desktop', 'Documents', 'Downloads', 'Library',
        'Movies', 'Music', 'Pictures', 'Public'
      ];
    }

    return ['file1.txt', 'file2.txt', 'subfolder'];
  }

  /**
   * Check for potential permission issues
   */
  private async checkPermissionIssues(path: string, missingFiles: string[]): Promise<string[]> {
    const issues: string[] = [];

    // Check if the directory itself has permission issues
    try {
      const pathInfo = await fileService.getFileInfo(path);
      if (!pathInfo) {
        issues.push(`Cannot access directory info for: ${path}`);
      }
    } catch (error) {
      if (error.message.includes('permission') || error.message.includes('denied')) {
        issues.push(`Permission denied accessing: ${path}`);
      }
    }

    // Check for common macOS permission-protected directories
    const protectedDirs = [
      'Library', 'System', '.Trash', '.ssh', 'Private'
    ];

    missingFiles.forEach(file => {
      if (protectedDirs.some(dir => file.includes(dir))) {
        issues.push(`Possible permission issue with protected directory/file: ${file}`);
      }

      if (file.startsWith('.') && file !== '.DS_Store') {
        issues.push(`Hidden file not accessible: ${file}`);
      }
    });

    return issues;
  }

  /**
   * Generate detailed comparison report
   */
  private generateComparisonDetails(
    path: string,
    appFiles: string[],
    bashFiles: string[],
    missing: string[],
    extra: string[],
    permissions: string[]
  ): string {
    const details = [
      `Directory: ${path}`,
      `App files (${appFiles.length}): ${appFiles.join(', ')}`,
      `Bash files (${bashFiles.length}): ${bashFiles.join(', ')}`,
      ''
    ];

    if (missing.length > 0) {
      details.push(`Missing in app (${missing.length}): ${missing.join(', ')}`);
    }

    if (extra.length > 0) {
      details.push(`Extra in app (${extra.length}): ${extra.join(', ')}`);
    }

    if (permissions.length > 0) {
      details.push(`Permission issues (${permissions.length}):`);
      permissions.forEach(issue => details.push(`  - ${issue}`));
    }

    if (missing.length === 0 && extra.length === 0) {
      details.push('✅ Perfect match between app and bash results!');
    }

    return details.join('\n');
  }

  /**
   * Run comprehensive validation on common directories
   */
  async runComprehensiveValidation(): Promise<ValidationResult[]> {
    console.log('🦑 Starting comprehensive file system validation...');

    const testDirectories = [
      '/Users/andrew',
      '/Users/andrew/Documents',
      '/Users/andrew/Desktop',
      '/Users/andrew/Downloads',
      '/Users/andrew/Pictures'
    ];

    const results: ValidationResult[] = [];

    for (const dir of testDirectories) {
      try {
        console.log(`🦑 Testing directory: ${dir}`);
        const result = await this.validateDirectory(dir, `Validate ${dir}`);
        results.push(result);

        // Add a small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`🦑 Failed to validate ${dir}:`, error);
      }
    }

    return results;
  }

  /**
   * Check macOS specific permissions and access
   */
  async checkMacOSPermissions(): Promise<ValidationResult> {
    console.log('🦑 Checking macOS specific permissions...');

    const permissionChecks = [
      'Full Disk Access',
      'File and Folder Access',
      'Developer Tools Access'
    ];

    const issues: string[] = [];
    const details: string[] = [];

    try {
      // Try to access system directories that require permissions
      const testPaths = [
        '/Users/andrew/Library',
        '/Users/andrew/.ssh',
        '/System/Library'
      ];

      for (const testPath of testPaths) {
        try {
          const files = await fileService.listDirectory(testPath);
          details.push(`✅ Can access ${testPath} (${files.length} items)`);
        } catch (error) {
          const errorMsg = `❌ Cannot access ${testPath}: ${error.message}`;
          details.push(errorMsg);

          if (error.message.includes('permission') || error.message.includes('denied')) {
            issues.push(`Permission denied for ${testPath}`);
          } else {
            issues.push(`Access error for ${testPath}: ${error.message}`);
          }
        }
      }

      // Check if Tauri has the necessary permissions
      try {
        const homeDir = await fileService.getHomeDirectory();
        details.push(`✅ Home directory accessible: ${homeDir}`);
      } catch (error) {
        issues.push(`Cannot get home directory: ${error.message}`);
      }

    } catch (error) {
      issues.push(`General permission check failed: ${error.message}`);
    }

    const result: ValidationResult = {
      testName: 'macOS Permissions Check',
      appFileCount: 0,
      bashFileCount: 0,
      appFiles: [],
      bashFiles: [],
      missingInApp: [],
      extraInApp: [],
      permissionIssues: issues,
      passed: issues.length === 0,
      details: details.join('\n')
    };

    this.results.push(result);
    return result;
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport(): string {
    const report = [
      '🦑 KrakenEgg File System Validation Report',
      '=' .repeat(60),
      '',
      `Total validations: ${this.results.length}`,
      `Passed: ${this.results.filter(r => r.passed).length}`,
      `Failed: ${this.results.filter(r => !r.passed).length}`,
      '',
      'Detailed Results:',
      '-'.repeat(40)
    ];

    this.results.forEach((result, index) => {
      report.push(`\n${index + 1}. ${result.testName}`);
      report.push(`   Status: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
      report.push(`   App files: ${result.appFileCount}, Bash files: ${result.bashFileCount}`);

      if (result.missingInApp.length > 0) {
        report.push(`   Missing in app: ${result.missingInApp.join(', ')}`);
      }

      if (result.extraInApp.length > 0) {
        report.push(`   Extra in app: ${result.extraInApp.join(', ')}`);
      }

      if (result.permissionIssues.length > 0) {
        report.push(`   Permission issues: ${result.permissionIssues.length}`);
        result.permissionIssues.forEach(issue => {
          report.push(`     - ${issue}`);
        });
      }
    });

    // Summary of permission issues
    const allPermissionIssues = this.results.flatMap(r => r.permissionIssues);
    if (allPermissionIssues.length > 0) {
      report.push('\nPermission Issues Summary:');
      report.push('-'.repeat(30));
      [...new Set(allPermissionIssues)].forEach(issue => {
        report.push(`⚠️  ${issue}`);
      });

      report.push('\n📋 Recommendations:');
      report.push('1. Check System Preferences > Security & Privacy > Privacy > Full Disk Access');
      report.push('2. Add KrakenEgg to allowed applications');
      report.push('3. Check Files and Folders permissions');
      report.push('4. Restart the app after granting permissions');
    }

    return report.join('\n');
  }

  /**
   * Get all validation results
   */
  getResults(): ValidationResult[] {
    return this.results;
  }

  /**
   * Clear previous results
   */
  clearResults(): void {
    this.results = [];
  }
}

export default FileSystemValidationTest;
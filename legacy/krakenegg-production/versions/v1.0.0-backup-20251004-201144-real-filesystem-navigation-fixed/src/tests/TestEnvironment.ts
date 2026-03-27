// Test Environment Framework for KrakenEgg
// Creates isolated temporary directories for comprehensive file operation testing

import { FileInfo } from '../types';
import fileService from '../services/fileService';

export interface TestFileStructure {
  [key: string]: TestFileStructure | string | null; // null means it's a file
}

export interface TestOperation {
  name: string;
  operation: () => Promise<any>;
  expectedResult?: any;
  validate?: (result: any) => boolean;
}

export class TestEnvironment {
  private baseTempDir: string = '';
  private testPaths: Set<string> = new Set();
  private createdFiles: Set<string> = new Set();
  private currentTestRun: string = '';

  constructor() {
    this.currentTestRun = `krakenegg_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize test environment with a temporary directory structure
   */
  async initialize(): Promise<void> {
    try {
      console.log('🦑 TestEnvironment: Initializing test environment...');

      // Create main temp directory
      this.baseTempDir = await this.createTempDirectory();
      console.log('🦑 TestEnvironment: Created base temp directory:', this.baseTempDir);

      // Set up basic test structure
      await this.setupBasicTestStructure();

      console.log('🦑 TestEnvironment: Initialization complete');
    } catch (error) {
      console.error('🦑 TestEnvironment: Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Create a temporary directory for testing
   */
  private async createTempDirectory(): Promise<string> {
    try {
      // Get the system temp directory first
      const systemTempDir = await fileService.getTempDirectory();
      const tempPath = `${systemTempDir}/${this.currentTestRun}`;

      await fileService.createDirectory(tempPath);
      this.testPaths.add(tempPath);
      console.log('🦑 TestEnvironment: Created temp directory at:', tempPath);
      return tempPath;
    } catch (error) {
      console.error('🦑 TestEnvironment: Failed to create temp directory:', error);
      throw error;
    }
  }

  /**
   * Set up basic test structure with various file types and directories
   */
  private async setupBasicTestStructure(): Promise<void> {
    const structure: TestFileStructure = {
      'Documents': {
        'Projects': {
          'project1': {
            'src': {
              'main.ts': null,
              'config.json': null,
              'utils.ts': null
            },
            'tests': {
              'main.test.ts': null,
              'integration': {
                'api.test.ts': null,
                'db.test.ts': null
              }
            },
            'README.md': null,
            'package.json': null
          },
          'project2': {
            'index.js': null,
            'styles.css': null
          }
        },
        'Notes': {
          'important.txt': null,
          'todo.md': null,
          'Archive': {
            'old_notes.txt': null
          }
        }
      },
      'Downloads': {
        'setup.exe': null,
        'document.pdf': null,
        'image.png': null,
        'archive.zip': null
      },
      'Pictures': {
        'vacation': {
          'photo1.jpg': null,
          'photo2.png': null
        },
        'screenshots': {
          'screen1.png': null
        }
      },
      'TestArea': {
        'empty_folder': {},
        'readonly_file.txt': null,
        'large_file.dat': null,
        'special chars äöü.txt': null,
        'spaces in name.doc': null
      }
    };

    await this.createStructure(this.baseTempDir, structure);
  }

  /**
   * Recursively create directory and file structure
   */
  private async createStructure(basePath: string, structure: TestFileStructure): Promise<void> {
    for (const [name, content] of Object.entries(structure)) {
      const fullPath = `${basePath}/${name}`;

      if (content === null) {
        // It's a file
        await this.createTestFile(fullPath, this.generateFileContent(name));
      } else {
        // It's a directory
        await fileService.createDirectory(fullPath);
        this.testPaths.add(fullPath);

        if (Object.keys(content).length > 0) {
          await this.createStructure(fullPath, content);
        }
      }
    }
  }

  /**
   * Generate realistic file content based on file extension
   */
  private generateFileContent(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const timestamp = new Date().toISOString();

    switch (ext) {
      case 'ts':
        return `// TypeScript file: ${filename}
// Generated on: ${timestamp}

export interface TestInterface {
  id: number;
  name: string;
  created: Date;
}

export class TestClass implements TestInterface {
  constructor(
    public id: number,
    public name: string,
    public created: Date = new Date()
  ) {}

  public greet(): string {
    return \`Hello, \${this.name}!\`;
  }
}

export default TestClass;
`;

      case 'js':
        return `// JavaScript file: ${filename}
// Generated on: ${timestamp}

function testFunction() {
  console.log('This is a test function');
  return {
    success: true,
    timestamp: new Date(),
    data: [1, 2, 3, 4, 5]
  };
}

module.exports = { testFunction };
`;

      case 'json':
        return JSON.stringify({
          name: filename.replace('.json', ''),
          version: '1.0.0',
          description: 'Test JSON file',
          created: timestamp,
          config: {
            debug: true,
            environment: 'test',
            features: ['feature1', 'feature2', 'feature3']
          },
          data: {
            numbers: [1, 2, 3, 4, 5],
            strings: ['test', 'data', 'content']
          }
        }, null, 2);

      case 'md':
        return `# ${filename}

Generated on: ${timestamp}

## Overview

This is a test markdown file created for testing purposes.

## Features

- **Bold text**
- *Italic text*
- \`Code snippets\`
- [Links](https://example.com)

## Code Example

\`\`\`typescript
interface TestData {
  id: number;
  content: string;
}

const data: TestData = {
  id: 1,
  content: 'Test content'
};
\`\`\`

## Lists

1. First item
2. Second item
3. Third item

- Bullet point 1
- Bullet point 2
- Bullet point 3

> This is a blockquote for testing
`;

      case 'txt':
        return `Text file: ${filename}
Generated on: ${timestamp}

This is a test text file with multiple lines of content.
It contains various types of text data for testing purposes.

Line 1: Regular text content
Line 2: Numbers 1234567890
Line 3: Special characters !@#$%^&*()
Line 4: Unicode characters: àáâãäåæçèéêë
Line 5: Mixed content: Test123 !@# äöü

End of test file.
`;

      case 'css':
        return `/* CSS file: ${filename} */
/* Generated on: ${timestamp} */

.test-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  margin: 10px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.test-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.test-button:hover {
  background-color: #0056b3;
}

@media (max-width: 768px) {
  .test-container {
    padding: 10px;
    margin: 5px;
  }
}
`;

      case 'dat':
        // Generate large file content for testing
        return Array(1000).fill(0).map((_, i) =>
          `Line ${i + 1}: This is test data for performance testing. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`
        ).join('\n');

      default:
        return `Test file: ${filename}
Generated on: ${timestamp}

This is a test file with generic content.
It can be used for various testing scenarios.

Content includes:
- Text data
- Timestamps
- File information
- Test markers

File size: ${Math.random() * 1000} bytes (simulated)
Test ID: ${Math.random().toString(36).substr(2, 9)}
`;
    }
  }

  /**
   * Create a test file with specific content
   */
  private async createTestFile(path: string, content: string): Promise<void> {
    try {
      await fileService.writeFile(path, content);
      this.createdFiles.add(path);
      console.log(`🦑 TestEnvironment: Created test file: ${path}`);
    } catch (error) {
      console.error(`🦑 TestEnvironment: Failed to create file ${path}:`, error);
      throw error;
    }
  }

  /**
   * Get the base temp directory path
   */
  getBasePath(): string {
    return this.baseTempDir;
  }

  /**
   * Get a specific test path
   */
  getTestPath(relativePath: string): string {
    return `${this.baseTempDir}/${relativePath}`;
  }

  /**
   * List all created test paths
   */
  getTestPaths(): string[] {
    return Array.from(this.testPaths);
  }

  /**
   * List all created test files
   */
  getTestFiles(): string[] {
    return Array.from(this.createdFiles);
  }

  /**
   * Verify test environment integrity
   */
  async verifyIntegrity(): Promise<boolean> {
    try {
      console.log('🦑 TestEnvironment: Verifying test environment integrity...');

      // Check if base directory exists
      const baseExists = await this.pathExists(this.baseTempDir);
      if (!baseExists) {
        console.error('🦑 TestEnvironment: Base directory does not exist');
        return false;
      }

      // Check if test paths exist
      for (const path of this.testPaths) {
        const exists = await this.pathExists(path);
        if (!exists) {
          console.error(`🦑 TestEnvironment: Test path does not exist: ${path}`);
          return false;
        }
      }

      // Check if test files exist and have content
      for (const file of this.createdFiles) {
        const exists = await this.pathExists(file);
        if (!exists) {
          console.error(`🦑 TestEnvironment: Test file does not exist: ${file}`);
          return false;
        }

        try {
          const content = await fileService.readFile(file);
          if (!content || content.length === 0) {
            console.error(`🦑 TestEnvironment: Test file is empty: ${file}`);
            return false;
          }
        } catch (error) {
          console.error(`🦑 TestEnvironment: Cannot read test file ${file}:`, error);
          return false;
        }
      }

      console.log('🦑 TestEnvironment: Integrity verification passed');
      return true;
    } catch (error) {
      console.error('🦑 TestEnvironment: Integrity verification failed:', error);
      return false;
    }
  }

  /**
   * Check if a path exists
   */
  private async pathExists(path: string): Promise<boolean> {
    try {
      await fileService.getFileInfo(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clean up test environment
   */
  async cleanup(): Promise<void> {
    try {
      console.log('🦑 TestEnvironment: Cleaning up test environment...');

      if (this.baseTempDir) {
        await fileService.deleteDirectory(this.baseTempDir, true); // recursive delete
        console.log('🦑 TestEnvironment: Deleted base temp directory:', this.baseTempDir);
      }

      this.testPaths.clear();
      this.createdFiles.clear();
      this.baseTempDir = '';

      console.log('🦑 TestEnvironment: Cleanup complete');
    } catch (error) {
      console.error('🦑 TestEnvironment: Cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Create additional test files for specific scenarios
   */
  async createScenarioFiles(scenario: string): Promise<void> {
    const scenarioPath = `${this.baseTempDir}/Scenarios/${scenario}`;

    try {
      await fileService.createDirectory(scenarioPath);
      this.testPaths.add(scenarioPath);

      switch (scenario) {
        case 'copy_paste':
          await this.createTestFile(`${scenarioPath}/source.txt`, 'Content to be copied');
          await this.createTestFile(`${scenarioPath}/template.json`, JSON.stringify({ type: 'template' }));
          break;

        case 'move_operations':
          await this.createTestFile(`${scenarioPath}/move_me.txt`, 'This file will be moved');
          await fileService.createDirectory(`${scenarioPath}/destination`);
          this.testPaths.add(`${scenarioPath}/destination`);
          break;

        case 'large_files':
          const largeContent = Array(10000).fill(0).map((_, i) => `Large file line ${i + 1}`).join('\n');
          await this.createTestFile(`${scenarioPath}/large.txt`, largeContent);
          break;

        case 'unicode_names':
          await this.createTestFile(`${scenarioPath}/测试文件.txt`, 'Chinese filename test');
          await this.createTestFile(`${scenarioPath}/файл.txt`, 'Russian filename test');
          await this.createTestFile(`${scenarioPath}/ファイル.txt`, 'Japanese filename test');
          break;

        case 'permissions':
          await this.createTestFile(`${scenarioPath}/readonly.txt`, 'Read-only file content');
          // Note: Setting permissions would require additional Tauri commands
          break;

        default:
          console.warn(`🦑 TestEnvironment: Unknown scenario: ${scenario}`);
      }

      console.log(`🦑 TestEnvironment: Created scenario files for: ${scenario}`);
    } catch (error) {
      console.error(`🦑 TestEnvironment: Failed to create scenario files for ${scenario}:`, error);
      throw error;
    }
  }
}

export default TestEnvironment;
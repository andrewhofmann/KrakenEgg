import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Page } from '@playwright/test';

/**
 * Creates a real temporary directory structure for integration testing.
 * Returns paths and a cleanup function.
 */
export function createSandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'krakenegg-test-'));

  // Create directory structure
  fs.mkdirSync(path.join(root, 'Documents'));
  fs.mkdirSync(path.join(root, 'Downloads'));
  fs.mkdirSync(path.join(root, 'Projects'));
  fs.mkdirSync(path.join(root, 'Projects', 'webapp'));
  fs.mkdirSync(path.join(root, 'EmptyFolder'));

  // Create files with real content
  fs.writeFileSync(path.join(root, 'readme.txt'), 'Hello World\nThis is a test file.\nLine 3.');
  fs.writeFileSync(path.join(root, 'notes.md'), '# Notes\n\n- Item 1\n- Item 2');
  fs.writeFileSync(path.join(root, 'photo.png'), Buffer.alloc(1024)); // fake 1KB image
  fs.writeFileSync(path.join(root, 'script.js'), 'console.log("hello");');
  fs.writeFileSync(path.join(root, 'data.json'), '{"key": "value"}');
  fs.writeFileSync(path.join(root, 'archive.zip'), Buffer.alloc(512)); // fake zip

  // Files in subdirectories
  fs.writeFileSync(path.join(root, 'Documents', 'report.pdf'), Buffer.alloc(2048));
  fs.writeFileSync(path.join(root, 'Documents', 'letter.docx'), Buffer.alloc(1536));
  fs.writeFileSync(path.join(root, 'Downloads', 'installer.dmg'), Buffer.alloc(4096));
  fs.writeFileSync(path.join(root, 'Projects', 'webapp', 'index.html'), '<html><body>Test</body></html>');
  fs.writeFileSync(path.join(root, 'Projects', 'webapp', 'style.css'), 'body { margin: 0; }');

  // Create many files for scroll testing
  for (let i = 0; i < 50; i++) {
    fs.writeFileSync(path.join(root, `file_${String(i).padStart(3, '0')}.txt`), `Content of file ${i}`);
  }

  return {
    root,
    cleanup: () => {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

/**
 * Injects Tauri mocks that serve REAL file data from the sandbox directory.
 * This makes the app behave as if it's reading real files.
 */
export async function setupSandboxMocks(page: Page, sandboxRoot: string) {
  // Read the actual directory contents and build mock responses
  const readDir = (dirPath: string) => {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      return entries.map(entry => {
        const fullPath = path.join(dirPath, entry.name);
        const stat = fs.statSync(fullPath);
        return {
          name: entry.name,
          is_dir: entry.isDirectory(),
          size: stat.size,
          modified_at: Math.floor(stat.mtimeMs / 1000),
          created_at: Math.floor(stat.birthtimeMs / 1000),
          permissions: 0o755,
          extension: entry.isDirectory() ? null : path.extname(entry.name).slice(1).toLowerCase() || null,
          is_symlink: entry.isSymbolicLink(),
        };
      });
    } catch {
      return [];
    }
  };

  // Pre-build directory data for the sandbox
  const dirCache: Record<string, any[]> = {};
  const walkAndCache = (dir: string) => {
    dirCache[dir] = readDir(dir);
    for (const entry of dirCache[dir]) {
      if (entry.is_dir) {
        walkAndCache(path.join(dir, entry.name));
      }
    }
  };
  walkAndCache(sandboxRoot);

  // Serialize dirCache for injection
  const dirCacheJson = JSON.stringify(dirCache);
  const rootPath = sandboxRoot;

  await page.addInitScript(({ dirCacheStr, rootPath }: { dirCacheStr: string; rootPath: string }) => {
    const dirCache = JSON.parse(dirCacheStr);

    (window as any).__TAURI_INTERNALS__ = {
      invoke: (cmd: string, args: any) => {
        switch (cmd) {
          case 'list_directory': {
            const p = args?.path || rootPath;
            const files = dirCache[p] || [];
            return Promise.resolve(files);
          }
          case 'get_home_directory':
            return Promise.resolve(rootPath);
          case 'read_file_content':
            // Can't read files from browser, return mock content
            return Promise.resolve('Mock file content for: ' + (args?.path || ''));
          case 'write_file_content':
          case 'save_app_state':
          case 'watch_directory':
          case 'unwatch_directory':
          case 'create_directory':
          case 'create_empty_file':
          case 'copy_items':
          case 'move_items':
          case 'delete_items':
            return Promise.resolve();
          case 'load_app_state':
            return Promise.resolve(null);
          case 'search_files': {
            // Search through the cached dir data
            const query = (args?.query || '').toLowerCase();
            const results: any[] = [];
            for (const [dir, files] of Object.entries(dirCache)) {
              for (const f of files as any[]) {
                if (f.name.toLowerCase().includes(query)) {
                  results.push(f);
                  if (results.length >= 20) break;
                }
              }
              if (results.length >= 20) break;
            }
            return Promise.resolve(results);
          }
          case 'list_layouts':
            return Promise.resolve([]);
          case 'preview_mrt':
            return Promise.resolve([]);
          case 'execute_mrt':
            return Promise.resolve();
          case 'calculate_folder_size':
            return Promise.resolve(1048576);
          case 'get_recursive_info':
            return Promise.resolve({ files: 10, folders: 2, size: 1048576, skipped: 0 });
          default:
            return Promise.resolve();
        }
      },
      transformCallback: (cb: Function) => {
        const id = Math.random();
        (window as any)[`_${id}`] = cb;
        return id;
      },
      metadata: {
        currentWebview: { label: 'main' },
        currentWindow: { label: 'main' },
      },
    };
  }, { dirCacheStr: dirCacheJson, rootPath });
}

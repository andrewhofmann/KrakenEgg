import { Page } from '@playwright/test';

/**
 * Injects Tauri API mocks into the page before the app loads.
 * Supports path-based directory listing for navigation testing.
 */
export async function setupTauriMocks(page: Page) {
  await page.addInitScript(() => {
    const homeFiles = [
      { name: '..', is_dir: true, size: 0, modified_at: 1700000000, created_at: 1700000000, permissions: 493, extension: null, is_symlink: false },
      { name: 'Documents', is_dir: true, size: 0, modified_at: 1700000000, created_at: 1700000000, permissions: 493, extension: null, is_symlink: false },
      { name: 'Downloads', is_dir: true, size: 0, modified_at: 1700000000, created_at: 1700000000, permissions: 493, extension: null, is_symlink: false },
      { name: 'readme.txt', is_dir: false, size: 1234, modified_at: 1700000000, created_at: 1700000000, permissions: 420, extension: 'txt', is_symlink: false },
      { name: 'photo.png', is_dir: false, size: 50000, modified_at: 1699999000, created_at: 1699999000, permissions: 420, extension: 'png', is_symlink: false },
      { name: 'script.js', is_dir: false, size: 890, modified_at: 1699998000, created_at: 1699998000, permissions: 493, extension: 'js', is_symlink: false },
    ];

    const documentsFiles = [
      { name: '..', is_dir: true, size: 0, modified_at: 1700000000, created_at: 1700000000, permissions: 493, extension: null, is_symlink: false },
      { name: 'notes.md', is_dir: false, size: 2048, modified_at: 1700000000, created_at: 1700000000, permissions: 420, extension: 'md', is_symlink: false },
      { name: 'report.pdf', is_dir: false, size: 102400, modified_at: 1699500000, created_at: 1699500000, permissions: 420, extension: 'pdf', is_symlink: false },
    ];

    const emptyFolder: never[] = [];

    (window as any).__TAURI_INTERNALS__ = {
      invoke: (cmd: string, args: any) => {
        switch (cmd) {
          case 'list_directory': {
            const path = args?.path || '/';
            if (path.includes('Documents')) return Promise.resolve(documentsFiles);
            if (path.includes('Downloads')) return Promise.resolve(emptyFolder);
            return Promise.resolve(homeFiles);
          }
          case 'get_home_directory':
            return Promise.resolve('/Users/testuser');
          case 'read_file_content':
            return Promise.resolve('Hello, world!\nThis is test content.\nLine 3 of the file.');
          case 'write_file_content':
            return Promise.resolve();
          case 'search_files':
            return Promise.resolve([
              { name: 'found.txt', is_dir: false, size: 100, modified_at: 1700000000, extension: 'txt', is_symlink: false },
              { name: 'Documents/notes.md', is_dir: false, size: 2048, modified_at: 1700000000, extension: 'md', is_symlink: false },
            ]);
          case 'save_app_state':
          case 'load_app_state':
            return Promise.resolve(null);
          case 'create_directory':
          case 'create_empty_file':
          case 'copy_items':
          case 'move_items':
          case 'delete_items':
          case 'watch_directory':
          case 'unwatch_directory':
            return Promise.resolve();
          case 'list_layouts':
            return Promise.resolve([]);
          case 'preview_mrt':
            return Promise.resolve([
              { original: 'readme.txt', new: 'readme_renamed.txt', status: 'ok', error: null },
            ]);
          case 'execute_mrt':
            return Promise.resolve();
          case 'calculate_folder_size':
            return Promise.resolve(1048576); // 1MB
          case 'get_recursive_info':
            return Promise.resolve({ files: 42, folders: 5, size: 1048576, skipped: 0 });
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
  });
}

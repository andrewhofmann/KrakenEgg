import { Page } from '@playwright/test';

// Mock file data for E2E tests
const MOCK_FILES = [
  { name: '..', is_dir: true, size: 0, modified_at: 1700000000, created_at: 1700000000, permissions: 493 },
  { name: 'Documents', is_dir: true, size: 0, modified_at: 1700000000, created_at: 1700000000, permissions: 493 },
  { name: 'Downloads', is_dir: true, size: 0, modified_at: 1700000000, created_at: 1700000000, permissions: 493 },
  { name: 'readme.txt', is_dir: false, size: 1234, modified_at: 1700000000, created_at: 1700000000, permissions: 420 },
  { name: 'photo.png', is_dir: false, size: 50000, modified_at: 1699999000, created_at: 1699999000, permissions: 420 },
  { name: 'script.js', is_dir: false, size: 890, modified_at: 1699998000, created_at: 1699998000, permissions: 493 },
];

const MOCK_SEARCH_RESULTS = [
  { name: 'found.txt', is_dir: false, size: 100, modified_at: 1700000000 },
];

/**
 * Injects Tauri API mocks into the page before the app loads.
 * This intercepts `window.__TAURI_INTERNALS__` invoke calls.
 */
export async function setupTauriMocks(page: Page) {
  await page.addInitScript(() => {
    // Mock the Tauri IPC
    (window as any).__TAURI_INTERNALS__ = {
      invoke: (cmd: string, args: any) => {
        switch (cmd) {
          case 'list_directory':
            return Promise.resolve([
              { name: '..', is_dir: true, size: 0, modified_at: 1700000000, created_at: 1700000000, permissions: 493 },
              { name: 'Documents', is_dir: true, size: 0, modified_at: 1700000000, created_at: 1700000000, permissions: 493 },
              { name: 'Downloads', is_dir: true, size: 0, modified_at: 1700000000, created_at: 1700000000, permissions: 493 },
              { name: 'readme.txt', is_dir: false, size: 1234, modified_at: 1700000000, created_at: 1700000000, permissions: 420 },
              { name: 'photo.png', is_dir: false, size: 50000, modified_at: 1699999000, created_at: 1699999000, permissions: 420 },
              { name: 'script.js', is_dir: false, size: 890, modified_at: 1699998000, created_at: 1699998000, permissions: 493 },
            ]);
          case 'read_file_content':
            return Promise.resolve('Hello, world!\nThis is test content.');
          case 'write_file_content':
            return Promise.resolve();
          case 'search_files':
            return Promise.resolve([
              { name: 'found.txt', is_dir: false, size: 100, modified_at: 1700000000 },
            ]);
          case 'save_app_state':
            return Promise.resolve();
          case 'load_app_state':
            return Promise.resolve(null);
          case 'create_directory':
            return Promise.resolve();
          case 'create_empty_file':
            return Promise.resolve();
          case 'copy_items':
          case 'move_items':
          case 'delete_items':
            return Promise.resolve();
          case 'list_layouts':
            return Promise.resolve([]);
          case 'preview_mrt':
            return Promise.resolve([]);
          default:
            return Promise.resolve();
        }
      },
      transformCallback: (cb: Function) => {
        const id = Math.random();
        (window as any)[`_${id}`] = cb;
        return id;
      },
    };

    // Mock the event listener
    (window as any).__TAURI_INTERNALS__.metadata = {
      currentWebview: { label: 'main' },
      currentWindow: { label: 'main' },
    };
  });
}

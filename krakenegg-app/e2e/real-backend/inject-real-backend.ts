/**
 * Injects a Tauri mock that delegates ALL invoke() calls to the real
 * backend test server via HTTP. This means every file operation
 * actually happens on the filesystem sandbox.
 */
import { Page } from '@playwright/test';

export async function injectRealBackend(page: Page, serverUrl: string) {
  await page.addInitScript((url: string) => {
    (window as any).__TAURI_INTERNALS__ = {
      invoke: async (cmd: string, args: any) => {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cmd, args }),
          });
          const result = await response.json();
          if (!result.ok) throw new Error(result.error);
          return result.data;
        } catch (err: any) {
          // For non-critical commands, return null silently
          if (['save_app_state', 'watch_directory', 'unwatch_directory',
               'load_app_state', 'plugin:event|listen'].includes(cmd)) {
            return null;
          }
          throw err;
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
  }, serverUrl);
}

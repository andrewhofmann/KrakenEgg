/**
 * REAL BACKEND TEST SERVER
 *
 * Instead of mocking __TAURI_INTERNALS__, this creates a real Node.js
 * backend that performs actual filesystem operations. The Tauri mock
 * delegates invoke() calls to this HTTP API, which does real I/O on
 * a sandbox directory.
 *
 * This catches bugs that static mocks miss:
 * - File operations that change state (copy/move/delete actually happen)
 * - Directory listings that reflect real sort order (not alphabetical mock data)
 * - File conflicts that occur with real files
 * - Path edge cases with real filesystem behavior
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface TestServer {
  url: string;
  sandboxRoot: string;
  server: http.Server;
  stop: () => Promise<void>;
}

export async function startTestServer(): Promise<TestServer> {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ke-real-'));

  // Create realistic directory structure
  const dirs = ['Documents', 'Downloads', 'Projects', 'Pictures', '.hidden_dir'];
  dirs.forEach(d => fs.mkdirSync(path.join(sandboxRoot, d)));
  fs.mkdirSync(path.join(sandboxRoot, 'Projects', 'webapp'));

  // Create files with varied names to expose sort-order bugs
  const files: [string, string][] = [
    ['readme.txt', 'Hello World'],
    ['UPPERCASE.TXT', 'UPPER'],
    ['photo.png', '\x89PNG'],
    ['script.js', 'console.log("hi")'],
    ['data.json', '{"key":"value"}'],
    ['archive.zip', 'PK\x03\x04'],
    ['.hidden_file', 'hidden'],
    ['a_first.txt', 'first alphabetically'],
    ['z_last.txt', 'last alphabetically'],
  ];
  files.forEach(([name, content]) => fs.writeFileSync(path.join(sandboxRoot, name), content));

  // Files in subdirs
  fs.writeFileSync(path.join(sandboxRoot, 'Documents', 'report.pdf'), Buffer.alloc(2048));
  fs.writeFileSync(path.join(sandboxRoot, 'Documents', 'notes.md'), '# Notes');
  fs.writeFileSync(path.join(sandboxRoot, 'Downloads', 'installer.dmg'), Buffer.alloc(4096));

  // 30 numbered files for scroll testing
  for (let i = 0; i < 30; i++) {
    fs.writeFileSync(path.join(sandboxRoot, `file_${String(i).padStart(3, '0')}.txt`), `File ${i}`);
  }

  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { cmd, args } = JSON.parse(body);
        const result = handleCommand(cmd, args, sandboxRoot);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, data: result }));
      } catch (err: any) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      const url = `http://127.0.0.1:${addr.port}`;
      resolve({
        url,
        sandboxRoot,
        server,
        stop: () => new Promise<void>((r) => {
          server.close(() => {
            fs.rmSync(sandboxRoot, { recursive: true, force: true });
            r();
          });
        }),
      });
    });
  });
}

function handleCommand(cmd: string, args: any, root: string): any {
  switch (cmd) {
    case 'list_directory': {
      const dirPath = args?.path || root;
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const files = entries.map(entry => {
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
      // Sort like the Rust backend: folders first, then alphabetical
      files.sort((a, b) => {
        if (a.is_dir === b.is_dir) return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        return b.is_dir ? 1 : -1;
      });
      return files;
    }

    case 'get_home_directory':
      return root;

    case 'read_file_content': {
      const content = fs.readFileSync(args.path, 'utf-8');
      return content;
    }

    case 'write_file_content': {
      fs.writeFileSync(args.path, args.content);
      return null;
    }

    case 'create_directory': {
      fs.mkdirSync(args.path, { recursive: true });
      return null;
    }

    case 'create_empty_file': {
      fs.writeFileSync(args.path, '');
      return null;
    }

    case 'copy_items':
    case 'copy_items_with_progress': {
      for (const src of args.sources) {
        const name = path.basename(src);
        const dest = path.join(args.dest, name);
        if (fs.statSync(src).isDirectory()) {
          fs.cpSync(src, dest, { recursive: true });
        } else {
          fs.copyFileSync(src, dest);
        }
      }
      return null;
    }

    case 'move_items':
    case 'move_items_with_progress': {
      for (const src of args.sources) {
        const name = path.basename(src);
        const dest = path.join(args.dest, name);
        fs.renameSync(src, dest);
      }
      return null;
    }

    case 'delete_items': {
      for (const p of args.paths) {
        fs.rmSync(p, { recursive: true, force: true });
      }
      return null;
    }

    case 'search_files': {
      const results: any[] = [];
      const query = (args.query || '').toLowerCase();
      const searchDir = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (entry.name.toLowerCase().includes(query)) {
            const fullPath = path.join(dir, entry.name);
            const stat = fs.statSync(fullPath);
            const rel = path.relative(args.path, fullPath);
            results.push({
              name: rel,
              is_dir: entry.isDirectory(),
              size: stat.size,
              modified_at: Math.floor(stat.mtimeMs / 1000),
              extension: entry.isDirectory() ? null : path.extname(entry.name).slice(1).toLowerCase() || null,
              is_symlink: false,
            });
          }
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            searchDir(path.join(dir, entry.name));
          }
        }
      };
      searchDir(args.path);
      return results;
    }

    case 'calculate_folder_size': {
      let size = 0;
      const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const p = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(p);
          else size += fs.statSync(p).size;
        }
      };
      walk(args.path);
      return size;
    }

    case 'get_recursive_info': {
      let files = 0, folders = 0, size = 0;
      const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const p = path.join(dir, entry.name);
          if (entry.isDirectory()) { folders++; walk(p); }
          else { files++; size += fs.statSync(p).size; }
        }
      };
      if (fs.statSync(args.path).isDirectory()) walk(args.path);
      else { files = 1; size = fs.statSync(args.path).size; }
      return { files, folders, size, skipped: 0 };
    }

    // No-ops for UI-only commands
    case 'save_app_state':
    case 'load_app_state':
    case 'watch_directory':
    case 'unwatch_directory':
    case 'list_layouts':
    case 'preview_mrt':
    case 'execute_mrt':
    case 'open_with_default':
    case 'preview_file':
      return null;

    default:
      return null;
  }
}

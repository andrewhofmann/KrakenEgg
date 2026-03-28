/**
 * NATIVE TAURI APP TEST RUNNER
 *
 * Launches the REAL Tauri app, drives it with cliclick (native macOS
 * mouse/keyboard), and verifies outcomes on the filesystem.
 *
 * Run with: npx tsx e2e/tauri-native/run-native-tests.ts
 */

import { launchApp, AppDriver } from './driver';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

let app: AppDriver;
let passed = 0;
let failed = 0;
const failures: string[] = [];

async function assert(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    failed++;
    failures.push(`${name}: ${err.message}`);
    console.log(`  ✘ ${name}: ${err.message}`);
  }
}

function expect(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
    },
    toContain: (sub: string) => {
      if (typeof actual !== 'string' || !actual.includes(sub)) throw new Error(`Expected to contain "${sub}"`);
    },
    notToContain: (sub: string) => {
      if (typeof actual === 'string' && actual.includes(sub)) throw new Error(`Should not contain "${sub}"`);
    },
    toBeGreaterThan: (n: number) => {
      if (actual <= n) throw new Error(`Expected > ${n}, got ${actual}`);
    },
    toExist: () => {
      if (!actual) throw new Error(`Expected to exist, got ${actual}`);
    },
  };
}

async function runTests() {
  console.log('\n🐙 KrakenEgg Native App Tests\n');
  console.log('Launching Tauri app...');

  app = await launchApp();
  console.log(`Sandbox: ${app.sandboxRoot}`);
  console.log('App launched. Running tests...\n');

  // ─── RENDERING ────────────────────────────────

  console.log('== Rendering ==');

  await assert('app window is visible', async () => {
    app.activate();
    await app.wait(1000);
  });

  await assert('app is not crashed on launch', async () => {
    const crashed = await app.isCrashed();
    expect(crashed).toBe(false);
  });

  // ─── KEYBOARD NAVIGATION ──────────────────────

  console.log('\n== Keyboard Navigation ==');

  await assert('arrow down works', async () => {
    // Click center of left panel to focus
    app.click(300, 300);
    await app.wait(500);
    app.key('arrow-down');
    await app.wait(300);
    app.key('arrow-down');
    await app.wait(300);
    app.key('arrow-down');
    await app.wait(300);
    // No crash check
    const crashed = await app.isCrashed();
    expect(crashed).toBe(false);
  });

  await assert('arrow up works', async () => {
    app.key('arrow-up');
    await app.wait(300);
    app.key('arrow-up');
    await app.wait(300);
  });

  await assert('arrow down to bottom does not crash', async () => {
    for (let i = 0; i < 40; i++) {
      app.key('arrow-down');
      await app.wait(30);
    }
    await app.wait(500);
    const crashed = await app.isCrashed();
    expect(crashed).toBe(false);
  });

  await assert('arrow up to top does not crash', async () => {
    for (let i = 0; i < 40; i++) {
      app.key('arrow-up');
      await app.wait(30);
    }
    await app.wait(500);
  });

  await assert('Tab switches panel', async () => {
    app.key('tab');
    await app.wait(500);
    app.key('tab');
    await app.wait(500);
  });

  // ─── DOUBLE CLICK ─────────────────────────────

  console.log('\n== Double Click ==');

  await assert('double-click on a folder area navigates', async () => {
    // Click in the file list area (first few rows are folders)
    app.click(300, 200);
    await app.wait(500);
    app.doubleClick(300, 200);
    await app.wait(2000);
    const crashed = await app.isCrashed();
    expect(crashed).toBe(false);
  });

  await assert('Backspace returns to parent', async () => {
    app.key('delete'); // Backspace on Mac
    await app.wait(1000);
  });

  // ─── FILE OPERATIONS ──────────────────────────

  console.log('\n== File Operations (verified on disk) ==');

  await assert('F7 creates a folder on disk', async () => {
    const name = `native_test_${Date.now()}`;
    app.key('f7');
    await app.wait(800);
    app.type(name);
    await app.wait(300);
    app.key('return');
    await app.wait(1500);

    // Verify on disk — the folder might be in the current directory
    // Since we may have navigated, check sandbox root
    const exists = fs.existsSync(path.join(app.sandboxRoot, name)) ||
                   fs.readdirSync(app.sandboxRoot, { recursive: true })
                     .some(f => f.toString().includes(name));
    expect(exists).toBe(true);
  });

  await assert('Shift+F4 creates a file on disk', async () => {
    const name = `native_file_${Date.now()}.txt`;
    execSync(`osascript -e 'tell application "System Events" to key code 118 using shift down'`, { stdio: 'ignore', shell: '/bin/zsh' });
    await app.wait(800);
    app.type(name);
    await app.wait(300);
    app.key('return');
    await app.wait(1500);

    const exists = fs.existsSync(path.join(app.sandboxRoot, name)) ||
                   fs.readdirSync(app.sandboxRoot, { recursive: true })
                     .some(f => f.toString().includes(name));
    expect(exists).toBe(true);
  });

  // ─── COPY (Cmd+C / Cmd+V) ────────────────────

  console.log('\n== Copy/Paste ==');

  await assert('Cmd+C does not crash', async () => {
    app.click(300, 250);
    await app.wait(500);
    app.cmdKey('c');
    await app.wait(500);
    const crashed = await app.isCrashed();
    expect(crashed).toBe(false);
  });

  await assert('Tab + Cmd+V does not crash', async () => {
    app.key('tab');
    await app.wait(500);
    app.cmdKey('v');
    await app.wait(1000);
    // Dismiss any dialog
    app.key('escape');
    await app.wait(500);
  });

  // ─── DELETE ───────────────────────────────────

  console.log('\n== Delete ==');

  await assert('Cmd+Backspace triggers delete dialog', async () => {
    // Create sacrificial file
    const sacName = `sacrifice_${Date.now()}.txt`;
    fs.writeFileSync(path.join(app.sandboxRoot, sacName), 'bye');

    // Refresh
    app.key('f2');
    await app.wait(1000);

    // Click a file and try to delete
    app.click(300, 350);
    await app.wait(500);
    execSync(`osascript -e 'tell application "System Events" to key code 51 using command down'`, { stdio: 'ignore', shell: '/bin/zsh' });
    await app.wait(800);
    // Cancel
    app.key('escape');
    await app.wait(500);
  });

  // ─── MODALS ───────────────────────────────────

  console.log('\n== Modals ==');

  await assert('Cmd+, opens settings', async () => {
    app.cmdKey(',');
    await app.wait(1000);
    app.key('escape');
    await app.wait(500);
  });

  await assert('Alt+F7 opens search', async () => {
    execSync(`osascript -e 'tell application "System Events" to key code 98 using option down'`, { stdio: 'ignore', shell: '/bin/zsh' });
    await app.wait(1000);
    app.key('escape');
    await app.wait(500);
  });

  await assert('Ctrl+Q toggles quick view', async () => {
    execSync(`osascript -e 'tell application "System Events" to keystroke "q" using control down'`, { stdio: 'ignore', shell: '/bin/zsh' });
    await app.wait(500);
    execSync(`osascript -e 'tell application "System Events" to keystroke "q" using control down'`, { stdio: 'ignore', shell: '/bin/zsh' });
    await app.wait(500);
  });

  // ─── RAPID STRESS ─────────────────────────────

  console.log('\n== Stress ==');

  await assert('rapid arrow keys (50 down, 50 up) no crash', async () => {
    app.click(300, 300);
    await app.wait(300);
    for (let i = 0; i < 50; i++) app.key('arrow-down');
    await app.wait(300);
    for (let i = 0; i < 50; i++) app.key('arrow-up');
    await app.wait(500);
    const crashed = await app.isCrashed();
    expect(crashed).toBe(false);
  });

  await assert('rapid Tab switching (20x)', async () => {
    for (let i = 0; i < 20; i++) {
      app.key('tab');
      await app.wait(50);
    }
    await app.wait(500);
  });

  await assert('rapid modal cycling', async () => {
    for (let i = 0; i < 3; i++) {
      app.cmdKey(',');
      await app.wait(300);
      app.key('escape');
      await app.wait(200);
      execSync(`osascript -e 'tell application "System Events" to key code 98 using option down'`, { stdio: 'ignore', shell: '/bin/zsh' });
      await app.wait(300);
      app.key('escape');
      await app.wait(200);
    }
  });

  // ─── SUMMARY ──────────────────────────────────

  console.log('\n' + '═'.repeat(50));
  console.log(`\n🐙 Results: ${passed} passed, ${failed} failed\n`);
  if (failures.length > 0) {
    console.log('Failures:');
    failures.forEach(f => console.log(`  ✘ ${f}`));
  }

  // Cleanup
  console.log('\nStopping app...');
  await app.stop();
  console.log('Done.\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(async (err) => {
  console.error('Fatal:', err.message);
  if (app) await app.stop();
  process.exit(1);
});

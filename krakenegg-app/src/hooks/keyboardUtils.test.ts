import { describe, it, expect, vi } from 'vitest';
import { joinPath, isHotkeyMatched } from './keyboardUtils';

// Helper to create a mock KeyboardEvent
const makeKeyEvent = (key: string, opts: Partial<KeyboardEvent> = {}): KeyboardEvent => {
  return {
    key,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...opts,
  } as KeyboardEvent;
};

describe('joinPath', () => {
  it('joins root path correctly', () => {
    expect(joinPath('/', 'file.txt')).toBe('/file.txt');
  });

  it('joins non-root path correctly', () => {
    expect(joinPath('/home/user', 'file.txt')).toBe('/home/user/file.txt');
  });
});

describe('isHotkeyMatched', () => {
  // Mock navigator.platform for Mac
  beforeAll(() => {
    Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true });
  });

  it('matches simple key (e.g., "Tab")', () => {
    expect(isHotkeyMatched(makeKeyEvent('Tab'), 'Tab')).toBe(true);
  });

  it('matches function keys', () => {
    expect(isHotkeyMatched(makeKeyEvent('F3'), 'F3')).toBe(true);
    expect(isHotkeyMatched(makeKeyEvent('F7'), 'F7')).toBe(true);
  });

  it('matches CmdOrCtrl+key on Mac', () => {
    expect(isHotkeyMatched(makeKeyEvent('c', { metaKey: true }), 'CmdOrCtrl+c')).toBe(true);
  });

  it('matches Shift+key', () => {
    expect(isHotkeyMatched(makeKeyEvent('F4', { shiftKey: true }), 'Shift+F4')).toBe(true);
  });

  it('matches Alt+key', () => {
    expect(isHotkeyMatched(makeKeyEvent('F7', { altKey: true }), 'Alt+F7')).toBe(true);
  });

  it('returns false for non-matching key', () => {
    expect(isHotkeyMatched(makeKeyEvent('a'), 'Tab')).toBe(false);
  });

  it('returns false for empty hotkey string', () => {
    expect(isHotkeyMatched(makeKeyEvent('a'), '')).toBe(false);
  });

  it('returns false when extra modifiers are pressed', () => {
    // Pressing Shift+Tab should not match plain Tab
    expect(isHotkeyMatched(makeKeyEvent('Tab', { shiftKey: true }), 'Tab')).toBe(false);
  });

  it('returns false when required modifier is missing', () => {
    // CmdOrCtrl+c without meta key
    expect(isHotkeyMatched(makeKeyEvent('c'), 'CmdOrCtrl+c')).toBe(false);
  });
});

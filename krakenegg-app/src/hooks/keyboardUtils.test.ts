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

  // --- Function keys F1 through F12 ---
  it('matches F1', () => {
    expect(isHotkeyMatched(makeKeyEvent('F1'), 'F1')).toBe(true);
  });

  it('matches F2', () => {
    expect(isHotkeyMatched(makeKeyEvent('F2'), 'F2')).toBe(true);
  });

  it('matches F4', () => {
    expect(isHotkeyMatched(makeKeyEvent('F4'), 'F4')).toBe(true);
  });

  it('matches F5', () => {
    expect(isHotkeyMatched(makeKeyEvent('F5'), 'F5')).toBe(true);
  });

  it('matches F6', () => {
    expect(isHotkeyMatched(makeKeyEvent('F6'), 'F6')).toBe(true);
  });

  it('matches F8', () => {
    expect(isHotkeyMatched(makeKeyEvent('F8'), 'F8')).toBe(true);
  });

  it('matches F9', () => {
    expect(isHotkeyMatched(makeKeyEvent('F9'), 'F9')).toBe(true);
  });

  it('matches F10', () => {
    expect(isHotkeyMatched(makeKeyEvent('F10'), 'F10')).toBe(true);
  });

  it('matches F11', () => {
    expect(isHotkeyMatched(makeKeyEvent('F11'), 'F11')).toBe(true);
  });

  it('matches F12', () => {
    expect(isHotkeyMatched(makeKeyEvent('F12'), 'F12')).toBe(true);
  });

  // --- Modifier combinations ---
  it('matches CmdOrCtrl+Shift+key', () => {
    expect(isHotkeyMatched(makeKeyEvent('a', { metaKey: true, shiftKey: true }), 'CmdOrCtrl+Shift+a')).toBe(true);
  });

  it('matches Alt+Shift+key', () => {
    expect(isHotkeyMatched(makeKeyEvent('x', { altKey: true, shiftKey: true }), 'Alt+Shift+x')).toBe(true);
  });

  it('does not match when wrong modifier pressed', () => {
    // Alt is pressed but hotkey expects Shift
    expect(isHotkeyMatched(makeKeyEvent('a', { altKey: true }), 'Shift+a')).toBe(false);
  });

  it('does not match Ctrl on Mac (should need Cmd)', () => {
    // On Mac, CmdOrCtrl expects metaKey, not ctrlKey
    expect(isHotkeyMatched(makeKeyEvent('c', { ctrlKey: true }), 'CmdOrCtrl+c')).toBe(false);
  });

  // --- Plain special keys ---
  it('matches plain Escape', () => {
    expect(isHotkeyMatched(makeKeyEvent('Escape'), 'Escape')).toBe(true);
  });

  it('matches plain Enter', () => {
    expect(isHotkeyMatched(makeKeyEvent('Enter'), 'Enter')).toBe(true);
  });

  it('matches plain Backspace', () => {
    expect(isHotkeyMatched(makeKeyEvent('Backspace'), 'Backspace')).toBe(true);
  });

  it('matches plain Delete', () => {
    expect(isHotkeyMatched(makeKeyEvent('Delete'), 'Delete')).toBe(true);
  });

  it('matches plain Space', () => {
    expect(isHotkeyMatched(makeKeyEvent(' '), 'Space')).toBe(true);
  });

  it('matches ArrowLeft', () => {
    expect(isHotkeyMatched(makeKeyEvent('ArrowLeft'), 'ArrowLeft')).toBe(true);
  });

  it('matches ArrowRight', () => {
    expect(isHotkeyMatched(makeKeyEvent('ArrowRight'), 'ArrowRight')).toBe(true);
  });

  // --- isHotkeyMatched edge cases ---
  it('isHotkeyMatched case insensitive key', () => {
    // e.key is uppercase 'A' but hotkey is lowercase 'a'
    expect(isHotkeyMatched(makeKeyEvent('A'), 'a')).toBe(true);
  });

  it('isHotkeyMatched with multiple modifiers CmdOrCtrl+Shift+key', () => {
    expect(isHotkeyMatched(makeKeyEvent('p', { metaKey: true, shiftKey: true }), 'CmdOrCtrl+Shift+p')).toBe(true);
  });

  it('handles modifier-only press (just Shift pressed, no main key)', () => {
    // When only Shift is pressed, key is 'Shift' itself
    expect(isHotkeyMatched(makeKeyEvent('Shift', { shiftKey: true }), 'Tab')).toBe(false);
  });

  it('handles unknown key gracefully', () => {
    expect(isHotkeyMatched(makeKeyEvent('SomeRandomKey123'), 'SomeRandomKey123')).toBe(true);
  });
});

describe('joinPath additional', () => {
  it('joinPath with nested path', () => {
    expect(joinPath('/a/b/c', 'file.txt')).toBe('/a/b/c/file.txt');
  });

  it('joinPath with trailing slash', () => {
    // The function does not strip trailing slashes, so this adds double slash
    expect(joinPath('/home/user/', 'file.txt')).toBe('/home/user//file.txt');
  });

  it('joinPath with empty filename', () => {
    expect(joinPath('/home', '')).toBe('/home/');
  });
});

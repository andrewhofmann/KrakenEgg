// Z-index system — centralized to prevent magic numbers
export const Z_INDEX = {
  fileRow: {
    cursor: 10,
    dragTarget: 20,
  },
  panel: {
    header: 30,
    historyDropdown: 50,
  },
  contextMenu: 100,
  modal: {
    backdrop: 200,
    operationStatus: 250,
    conflict: 301,
    confirmation: 300,
    input: 300,
    viewer: 300,
    editor: 300,
    search: 300,
    settings: 300,
    goToPath: 300,
    multiRename: 300,
  },
  operationsDrawer: 150,
} as const;

// Conflict resolution options — typed enum instead of string literals
export const CONFLICT_RESOLUTION = {
  Overwrite: 'Overwrite',
  Skip: 'Skip',
  OverwriteAll: 'OverwriteAll',
  SkipAll: 'SkipAll',
  Cancel: 'Cancel',
} as const;

export type ConflictResolutionType = typeof CONFLICT_RESOLUTION[keyof typeof CONFLICT_RESOLUTION];

// File name validation
const INVALID_CHARS = /[<>:"|?*\x00-\x1f]/;
const RESERVED_NAMES = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'LPT1', 'LPT2', 'LPT3'];

export function validateFileName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name cannot be empty' };
  }
  if (name === '.' || name === '..') {
    return { valid: false, error: 'Invalid name' };
  }
  if (INVALID_CHARS.test(name)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }
  if (name.length > 255) {
    return { valid: false, error: 'Name too long (max 255 characters)' };
  }
  if (RESERVED_NAMES.includes(name.toUpperCase())) {
    return { valid: false, error: `"${name}" is a reserved name` };
  }
  if (name.endsWith(' ') || name.endsWith('.')) {
    return { valid: false, error: 'Name cannot end with a space or period' };
  }
  return { valid: true };
}

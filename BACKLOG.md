# KrakenEgg Bug Backlog

Bugs discovered during testing are tracked here. Each entry includes severity, reproduction steps, and resolution status.

## Format

- **ID**: BUG-XXXX
- **Status**: `open` | `in-progress` | `fixed` | `wont-fix`
- **Severity**: `critical` | `high` | `medium` | `low`
- **Found in**: version
- **Fixed in**: version (when resolved)
- **Description**: What goes wrong
- **Steps to Reproduce**: How to trigger
- **Expected vs Actual**: What should happen vs what does

---

## Open Bugs

### BUG-0001
- **Status**: `open`
- **Severity**: `low`
- **Found in**: 0.1.0
- **Description**: SettingsModal triggers React `act()` warnings when switching to Layouts tab
- **Notes**: Does not affect runtime behavior. Test environment only.

### BUG-0002
- **Status**: `open`
- **Severity**: `low`
- **Found in**: 0.1.0
- **Description**: Commander mouse selection mode is incomplete (WIP)

### BUG-0005
- **Status**: `open`
- **Severity**: `medium`
- **Found in**: 0.1.0
- **Description**: Progress tracking shows 0/0 totals — bytes_done/bytes_total always zero
- **Notes**: ProgressPayload fields exist but are not populated during copy/move operations.

### BUG-0006
- **Status**: `open`
- **Severity**: `low`
- **Found in**: 0.1.0
- **Description**: `any` type used in Rust invoke for `load_app_state`
- **Fixed in**: Phase A — replaced with proper SavedState interface

---

## Fixed Bugs

### BUG-0003
- **Status**: `fixed`
- **Severity**: `medium`
- **Found in**: 0.1.0
- **Fixed in**: Phase 1 (filesystem watcher)
- **Description**: File panel uses 2-second polling instead of filesystem watcher

### BUG-0004
- **Status**: `fixed`
- **Severity**: `low`
- **Found in**: 0.1.0
- **Fixed in**: Phase A
- **Description**: Rust `commands.rs` has unnecessary braces warnings

### BUG-0006
- **Status**: `fixed`
- **Severity**: `low`
- **Found in**: 0.1.0
- **Fixed in**: Phase A
- **Description**: `any` type used in store loadState — replaced with typed SavedState interface

### BUG-0007
- **Status**: `fixed`
- **Severity**: `medium`
- **Found in**: 0.1.0
- **Fixed in**: Phase A
- **Description**: Rust unwrap() panic risk on path.parent() in compress command

### BUG-0008
- **Status**: `fixed`
- **Severity**: `low`
- **Found in**: 0.1.0
- **Fixed in**: Phase A
- **Description**: console.error() used instead of user-visible error notifications in 4 locations

### BUG-0009
- **Status**: `fixed`
- **Severity**: `medium`
- **Found in**: 0.1.0
- **Fixed in**: Phase A
- **Description**: No fallback for corrupted config — loadState now silently uses defaults on failure

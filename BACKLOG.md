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
- **Steps to Reproduce**: In tests, render SettingsModal and click the Layouts tab. The `useEffect` that fetches layouts via `invoke('list_layouts')` triggers a state update outside of `act()`.
- **Expected vs Actual**: No warnings expected. Actual: React `act()` warning in test output.
- **Notes**: Does not affect runtime behavior. Only appears in test environment. Could be fixed by wrapping the layouts tab switch in `act()` or by adjusting the component's effect lifecycle.

### BUG-0002
- **Status**: `open`
- **Severity**: `low`
- **Found in**: 0.1.0
- **Description**: Commander mouse selection mode is incomplete (WIP)
- **Steps to Reproduce**: Open Settings > Behavior > Mouse Selection Mode. "Commander [WIP]" option is visible but not fully implemented.
- **Expected vs Actual**: Right-click selection behavior should match Total Commander. Actual: Labeled as WIP, behavior not fully implemented.

### BUG-0003
- **Status**: `open`
- **Severity**: `medium`
- **Found in**: 0.1.0
- **Description**: File panel uses 2-second polling instead of filesystem watcher
- **Steps to Reproduce**: Make changes to files outside the app. Changes are not reflected until the next 2-second poll cycle.
- **Expected vs Actual**: Changes should be detected near-instantly via OS filesystem events. Actual: 2-second delay with higher CPU usage than necessary.

### BUG-0004
- **Status**: `open`
- **Severity**: `low`
- **Found in**: 0.1.0
- **Description**: Rust `commands.rs` has unnecessary braces warnings
- **Steps to Reproduce**: Run `cargo clippy` or `cargo test`. Two `unnecessary braces around block return value` warnings appear at lines 258 and 562.
- **Expected vs Actual**: Clean compilation. Actual: Two warnings.

---

## Fixed Bugs

_(none yet)_

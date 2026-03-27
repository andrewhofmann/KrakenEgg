# KrakenEgg Test Catalog

## Summary

| Category | Unit Tests | E2E Tests | Total |
|----------|-----------|-----------|-------|
| Store (original + actions) | 77 | — | 77 |
| Utils (format, fileIcons, constants) | 41 | — | 41 |
| Hooks (keyboard, panelData) | 16 | — | 16 |
| Components (14 test files) | 123 | — | 123 |
| Rust: utils | 12 | — | 12 |
| Rust: app_state | 5 | — | 5 |
| Rust: mrt | 15 | — | 15 |
| Rust: archive | 7 | — | 7 |
| E2E: Playwright | — | 10 | 10 |
| **Total** | **296** | **10** | **306** |

## Frontend Test Files (Vitest + jsdom)

| File | Tests | Category |
|------|-------|----------|
| `src/store.test.ts` | 17 | Store: search, viewer, editor |
| `src/store/actions.test.ts` | 60 | Store: navigation, tabs, clipboard, sort, hotkeys, modals, file creation |
| `src/store/constants.test.ts` | 16 | Store: createTab, getProcessedFiles, getExtension |
| `src/utils/format.test.ts` | 14 | Utils: formatSize, formatDate, getExtension |
| `src/utils/fileIcons.test.ts` | 16 | Utils: getFileIcon, getFileIconColor |
| `src/utils/constants.test.ts` | 11 | Utils: Z_INDEX, CONFLICT_RESOLUTION, validateFileName |
| `src/hooks/keyboardUtils.test.ts` | 11 | Hooks: isHotkeyMatched, joinPath |
| `src/hooks/usePanelData.test.ts` | 5 | Hooks: directory listing, watcher, cleanup |
| `src/components/FileRow.test.tsx` | 15 | Component: file row rendering, interactions, dir size |
| `src/components/TabBar.test.tsx` | 8 | Component: tab management UI |
| `src/components/SearchFilter.test.tsx` | 9 | Component: inline filter widget |
| `src/components/ContextMenu.test.tsx` | 9 | Component: right-click context menu |
| `src/components/ConfirmationModal.test.tsx` | 7 | Component: confirmation dialog |
| `src/components/InputModal.test.tsx` | 7 | Component: text input prompt |
| `src/components/ViewerModal.test.tsx` | 7 | Component: file viewer |
| `src/components/EditorModal.test.tsx` | 9 | Component: text editor |
| `src/components/GoToPathModal.test.tsx` | 7 | Component: path navigation |
| `src/components/SettingsModal.test.tsx` | 10 | Component: settings/preferences |
| `src/components/SearchModal.test.tsx` | 14 | Component: search interface |
| `src/components/ErrorBoundary.test.tsx` | 5 | Component: crash resilience |

## Rust Test Modules (cargo test --lib)

| Module | Tests | Category |
|--------|-------|----------|
| `utils.rs` | 12 | File ops, format, binary detection |
| `app_state.rs` | 5 | Config path, save/load state |
| `mrt.rs` | 15 | Multi-rename: patterns, regex, case, collisions |
| `archive.rs` | 7 | ZIP: parse, list, add, remove, read |

## E2E Tests (Playwright)

| File | Tests | Category |
|------|-------|----------|
| `e2e/dual-pane.spec.ts` | 3 | App mount, DOM, title |
| `e2e/keyboard.spec.ts` | 3 | Tab switch, F3, Escape |
| `e2e/search.spec.ts` | 2 | Search open/close |
| `e2e/settings.spec.ts` | 2 | Settings open, no crash |

## How to Run

```bash
pnpm test           # Frontend unit tests (257 tests)
pnpm test:coverage  # With coverage report
pnpm test:rust      # Rust unit tests (39 tests)
pnpm test:e2e       # Playwright E2E (10 tests)
pnpm test:all       # Frontend + Rust combined
```

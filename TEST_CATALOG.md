# KrakenEgg Test Catalog

## Summary

| Category | Unit Tests | E2E Tests | Total |
|----------|-----------|-----------|-------|
| Store (existing + actions) | 70 | — | 70 |
| Utils + Constants | 30 | — | 30 |
| Hooks (keyboard + panelData) | 15 | — | 15 |
| Components (FileRow, TabBar, modals, etc.) | 101 | — | 101 |
| Rust: utils | 12 | — | 12 |
| Rust: app_state | 5 | — | 5 |
| Rust: mrt | 9 | — | 9 |
| Rust: archive | 7 | — | 7 |
| E2E: Dual Pane | — | 3 | 3 |
| E2E: Keyboard | — | 3 | 3 |
| E2E: Search | — | 2 | 2 |
| E2E: Settings | — | 2 | 2 |
| **Total** | **249** | **10** | **259** |

## Test Files

### Frontend Unit Tests (Vitest + jsdom)
| File | Tests | Category |
|------|-------|----------|
| `src/store.test.ts` | 17 | Store: search, viewer, editor |
| `src/store/actions.test.ts` | 53 | Store: navigation, tabs, clipboard, sort, hotkeys, modals |
| `src/store/constants.test.ts` | 16 | Store: createTab, getProcessedFiles, getExtension |
| `src/utils/format.test.ts` | 14 | Utils: formatSize, formatDate, getExtension |
| `src/hooks/keyboardUtils.test.ts` | 11 | Hooks: isHotkeyMatched, joinPath |
| `src/hooks/usePanelData.test.ts` | 4 | Hooks: directory listing, polling, cleanup |
| `src/components/FileRow.test.tsx` | 14 | Component: file row rendering, interactions |
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

### Rust Unit Tests (cargo test --lib)
| Module | Tests | Category |
|--------|-------|----------|
| `utils.rs` | 12 | File ops, format, binary detection |
| `app_state.rs` | 5 | Config path, save/load state |
| `mrt.rs` | 9 | Multi-rename preview and execution |
| `archive.rs` | 7 | ZIP parse, list, add, remove, read |

### E2E Tests (Playwright)
| File | Tests | Category |
|------|-------|----------|
| `e2e/dual-pane.spec.ts` | 3 | App mount, DOM, title |
| `e2e/keyboard.spec.ts` | 3 | Tab switch, F3, Escape |
| `e2e/search.spec.ts` | 2 | Search open/close |
| `e2e/settings.spec.ts` | 2 | Settings open, no crash |

## How to Run

```bash
# Frontend unit tests
pnpm test

# Frontend unit tests with coverage
pnpm test:coverage

# Rust unit tests
pnpm test:rust

# E2E tests (Playwright)
pnpm test:e2e

# All tests (frontend + Rust)
pnpm test:all
```

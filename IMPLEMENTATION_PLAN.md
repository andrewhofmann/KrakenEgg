# KrakenEgg Implementation Strategy & Execution Plan

This document outlines the execution strategy for transforming KrakenEgg into a modern, high-performance dual-pane file manager.

## 🎨 UI/UX Design System (Global Mandates)
To ensure the app remains "modern and clean" unlike the utilitarian/cluttered look of the original Total Commander:

1.  **Glassmorphism & Depth:** Continue using macOS-native aesthetics (`backdrop-blur-md`, semi-transparent sidebars) but ensure high contrast for text.
2.  **Visual Hierarchy:**
    -   **Primary Actions:** Solid buttons (Blue/Accent).
    -   **Secondary Actions:** Outlined or Icon-only buttons with tooltips.
    -   **Destructive Actions:** Red accents, requiring double-confirmation.
3.  **Density Control:**
    -   **Lists:** Compact (like now), but with clear hover states.
    -   **Modals:** Spacious padding (p-6+), overlay backdrops to focus attention.
4.  **Feedback Loops:** Every file operation must provide immediate visual feedback (toast, progress bar, or list animation).

---

## 📅 Execution Phases

### 🔥 Phase 1: Robust File Operations (Priority: CRITICAL)
**Goal:** Make moving data safe, transparent, and non-blocking. Users trust the app only if this works perfectly.

#### 1.1 Background Transfer Queue
*   **The Problem:** Currently, a large copy blocks the UI or only shows one modal.
*   **The Solution:** A non-blocking "Operations Drawer" at the bottom of the screen.
*   **Implementation:**
    *   **Backend:** Create a `TransferManager` struct in Rust using `tokio::spawn` to manage multiple async tasks. It maintains a `Vec<Task>` (Queued, Running, Paused).
    *   **Frontend:** A global `OperationsStore` in Zustand.
    *   **UI:** A collapsible bottom bar showing: "3 Operations | 1.2GB/s". Clicking it expands a list of active transfers with Pause/Cancel buttons.
*   **Testing:**
    *   Queue 5 large folder copies.
    *   Pause the 2nd one. Cancel the 3rd.
    *   Verify data integrity of the completed ones.

#### 1.2 Advanced Conflict Resolution
*   **The Problem:** Simple "Yes/No" isn't enough for 1000 files.
*   **The Solution:** A "Smart Conflict" dialog.
*   **Implementation:**
    *   **Backend:** Add `compare_metadata(src, dest)` to return `Newer`, `Larger`, `Identical`.
    *   **UI:** When conflict starts, show detailed comparison: Source (Date/Size) vs Dest (Date/Size).
    *   **Options:** "Overwrite if Newer", "Rename (Counter)", "Compare by Content".
*   **Testing:** Create scenarios with older/newer files and verify the correct ones are replaced or skipped.

---

### 🏷 Phase 2: Mass File Management (Priority: HIGH)
**Goal:** Tools for organizing chaos. The "Killer Feature" of file managers.

#### 2.1 Multi-Rename Tool (MRT)
*   **UI Concept:** A split-screen modal. Left: Original Names. Right: Live Preview of New Names. Top: Rules Engine.
*   **Implementation:**
    *   **Backend:** A pure logic function `preview_rename(files, rules) -> Vec<(OldName, NewName)>`.
    *   **Frontend:** Inputs for: Search (Regex support), Replace, Case (Upper/Lower/Title), Counter (`[C]`).
    *   **Safety:** The "Go" button is disabled if any collision is detected in the preview.
*   **Testing:**
    *   Rename 100 files `img.jpg` -> `Vacation_001.jpg`.
    *   Test Regex capture groups.

#### 2.2 Change Attributes & Dates
*   **UI:** A specialized modal mimicking the Windows/macOS properties dialog but batch-capable.
*   **Backend:** `filetime` crate for modifying `atime`, `mtime`, `ctime`.
*   **Testing:** Verify timestamps change using system Finder/Explorer.

---

### 👁 Phase 3: Viewer & Quick Info (Priority: MEDIUM)
**Goal:** Preview content without context switching.

#### 3.1 Enhanced Quick View (Ctrl+Q)
*   **Current:** Basic metadata.
*   **Upgrade:** Turn the inactive pane into a rich viewer.
*   **Implementation:**
    *   **Text:** Use `monaco-editor` (read-only) or `prismjs` for syntax highlighting.
    *   **Images:** Render `img` tag.
    *   **Markdown:** Render rendered HTML.
    *   **Binaries:** Show Hex dump (lazy loaded).
*   **Performance:** Backend must only send the first 10KB of text/hex to frontend initially.

#### 3.2 Lister (F3)
*   **Concept:** A dedicated lightweight popup window (separate Tauri window) for viewing files, independent of the main app focus.

---

### 🔍 Phase 4: Search & Navigation (Priority: MEDIUM)
**Goal:** Find things fast.

#### 4.1 "Everything" / Indexed Search
*   **Implementation:**
    *   **macOS:** Interface with `mdfind` (Spotlight CLI).
    *   **Windows:** Interface with `es.exe` (Everything CLI) or NTFS USN Journal reading (Rust `ntfs` crate).
*   **UI:** Search results appear in the file panel as a "Virtual Folder" list.

#### 4.2 Directory History & Hotlist
*   **UI:**
    *   **History:** Dropdown on the path bar (Alt+Down).
    *   **Hotlist (Bookmarks):** A star icon in the toolbar.
*   **Backend:** Persist `history.json` and `bookmarks.json` in `app_data`.

---

### 🧪 QA & Verification Strategy

To ensure "homogeneous and modern" quality, every feature must pass this gauntlet:

1.  **The "Native Feel" Check:**
    *   Does resizing feel 60fps? (Use CSS variables, not React state for layout).
    *   Do tooltips appear instantly or with correct delay?
    *   Are scrollbars stylized or native?

2.  **The "Safety" Check:**
    *   **Dry Run:** For Rename/Delete/Move, can the backend simulate the op and report errors *before* touching disk?
    *   **Undo:** Can we implement a basic Undo stack? (Move files to a temp `.trash` folder before deleting, or keep a log of renames).

3.  **Automated Testing:**
    *   **Backend:** `cargo test` for all path parsing, archive logic, and sorting logic.
    *   **Frontend:** `vitest` for the Store logic (reducers).

4.  **Compilation Gate:**
    *   As per current protocol, `cargo build` and `npm run build` must pass after every single modification.

---

## 🚦 Next Steps (Immediate)

1.  **Operations Drawer:** Move the current blocking "OperationStatusModal" to a non-blocking bottom-bar component.
2.  **Recursive Info:** Hook up the `get_recursive_info` backend command (already written) to the `QuickInfoPanel` (already written) to verify the data flow.

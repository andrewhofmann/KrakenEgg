# KrakenEgg Development Roadmap (Total Commander Inspired)

This roadmap is derived from an analysis of Total Commander versions 9.0 through 11.56, focusing on "Power User" features that differentiate a dual-pane manager from a standard file explorer.

## 🚀 Phase 1: Advanced File Operations
Enhancing the robustness and flexibility of basic Copy/Move/Delete actions.

- [ ] **Background Transfer Manager (Queueing)**
    - Implement a queue system so users can start multiple large copy/move operations without freezing the UI.
    - Show a second progress bar for "Total Operation" vs "Current File".
    - Allow Pausing/Resuming transfers.
- [ ] **Smart Overwrite Options**
    - Add "Rename older target files, skip newer" to the Conflict Resolution dialog.
    - Add "Compare by Content" button inside the Overwrite Conflict dialog.
    - Implement "Auto-Rename" (e.g., `file (2).txt`) as a conflict strategy.
- [ ] **Relative Path Preservation**
    - When copying search results (flattened list) to a folder, offer to "Keep relative paths" to recreate the folder structure in the destination.
- [ ] **Sparse File Copying**
    - Optimize copying for large files with empty data (zeros) to save disk space and time.

## 🏷 Phase 2: Mass Rename & Attributes
Total Commander's "Multi-Rename Tool" is a flagship feature.

- [ ] **Multi-Rename Tool (MRT)**
    - Create a dedicated modal for batch renaming.
    - Support Regex (Regular Expressions).
    - **Placeholders:**
        - `[N]` Name, `[E]` Extension.
        - `[C]` Counter (Start, Step, Digits).
        - `[YMD]` Date/Time insertion.
        - `[P]` Parent folder name.
    - **Undo:** Allow undoing the last batch rename operation.
- [ ] **Change Attributes/Timestamp**
    - Allow modifying Created/Modified/Accessed dates for multiple files at once.
    - Support partial updates (e.g., change only the Year).

## 👁 Phase 3: Viewer & Quick View (Ctrl+Q)
Enhancing how users preview files without opening external apps.

- [ ] **Quick View Panel (Ctrl+Q)** (In Progress)
    - Implement the logic to turn the *inactive* pane into a preview window for the *active* pane's selection.
    - Support Text (with syntax highlighting), Images, and Audio/Video.
    - **Link Targets:** If a Symlink/Shortcut is selected, show the target path and contents of the target.
- [ ] **Lister (F3) Improvements**
    - **Hex View:** Allow viewing binary files in Hexadecimal format.
    - **Text Selection:** Allow copying text/hex from the viewer.
    - **Search inside Viewer:** Find text within the file being previewed.

## 📂 Phase 4: Navigation & Tabs
Making movement through the file system faster.

- [ ] **Locked Tabs**
    - Allow locking a tab to a specific path.
    - **Locked but navigable:** You can browse subfolders, but clicking the tab header or switching back always resets it to the root locked path.
    - Visual indicator (e.g., `*` or icon) for locked tabs.
- [ ] **Directory History**
    - Implement a dropdown history of visited folders (Alt+Down Arrow).
    - **Frequently Used:** Track and pin most visited directories.
- [ ] **Tab Management**
    - `Ctrl+Shift+A`: Show a searchable list of all open tabs (useful when many tabs are open).
    - "Close Duplicate Tabs" command.
    - "Reopen Closed Tab" (Ctrl+Shift+T).

## 🔍 Phase 5: Search & Synchronization
Advanced tools for finding and organizing data.

- [ ] **Synchronize Directories**
    - A specialized view comparing Left vs. Right panes.
    - Show differences: `->` (Copy Left to Right), `<-` (Copy Right to Left), `=` (Equal), `!=` (Different content).
    - Allow filtering by: Singles, Duplicates, Newer, Older.
- [ ] **"Everything" Integration (Windows/macOS Index)**
    - Leverage OS indexing (Spotlight on Mac, Everything on Windows) for instant search results.
    - Allow searching inside archives.
- [ ] **Quick Search / Quick Filter**
    - Refine current "Type to select" to optionally filter the list (hide non-matches) instead of just jumping to them.

## 📦 Phase 6: Archives (Deep Dive)
Treating archives exactly like folders.

- [ ] **Nested Archives**
    - Allow opening a `.zip` inside another `.zip` seamlessly.
- [ ] **7-Zip / RAR Support**
    - Integrate 7-Zip libraries for better compression ratios and format support.
- [ ] **Packer Plugins**
    - Allow user-defined compression settings (Compression level 0-9).

## 🎨 Phase 7: UI/UX Refinements
Polishing the visual experience.

- [ ] **Column Customization**
    - Allow saving specific column layouts for specific folder types (e.g., "Photos" layout showing resolution/EXIF, "Code" layout showing extension).
- [ ] **Visual Cues**
    - Dim/fade hidden files (dotfiles).
    - Show overlay icons for Symlinks and Read-Only files.
    - **Free Space Bar:** Visual bar under the drive list showing disk usage.
- [ ] **Checksums**
    - Create/Verify CRC, MD5, SHA256 files.

## ⌨️ Phase 8: Automation & Scripting
- [ ] **Internal Commands**
    - Expose internal commands (e.g., `cm_Copy`, `cm_Rename`) so users can bind them to custom buttons or hotkeys.
- [ ] **Button Bar**
    - Allow users to create a toolbar of shortcuts to favorite apps or internal commands.

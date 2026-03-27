# Version Control - KrakenEgg

## Active Development Version

**Current Version: v1.0.3**

**Active Directory**: `/krakenegg-production/versions/v1.0.3/`

All development work should be done in the v1.0.3 directory. This is the current stable working version with all latest fixes and improvements.

## Version History

### v1.0.3 (Current - 2025-01-06)
- **Status**: ACTIVE DEVELOPMENT
- **Directory**: `versions/v1.0.3/`
- **Description**: Latest version with keyboard navigation rollback fixes and version consistency updates
- **Key Features**:
  - Fixed React Hook dependency issues that caused blank window
  - Restored stable keyboard navigation with proper throttling
  - Updated version consistency across all UI components
  - Status bar and About dialog now show correct version numbers

### v1.0.2 (Archived - 2025-01-06)
- **Status**: ARCHIVED
- **Directory**: `versions/v1.0.2/`
- **Description**: Previous stable version with scroll fixes and panel layout improvements
- **Key Accomplishments**:
  - Fixed brief view panel splitting (50/50 layout)
  - Optimized column widths for single-line display
  - Resolved vertical mouse wheel scrolling issues
  - Added compact file type display
  - Implemented height constraint patterns for scrollable containers

## Development Guidelines

1. **Always work in the current active version directory** (v1.0.3)
2. **Never modify archived versions** unless explicitly creating patches
3. **Update this file when creating new versions**
4. **Ensure version numbers are consistent** across package.json, Cargo.toml, and UI components
5. **Test thoroughly** before marking any version as stable

## Starting Development

To begin development work:

```bash
cd /Users/andrew/Documents/Personal/Dev\ AI\ Coding/KrakenEgg/krakenegg-production/versions/v1.0.3/
npm install
npm run tauri:dev
```

## Version Bumping Process

When creating a new version:

1. Copy entire directory structure from current version
2. Update version numbers in:
   - `package.json`
   - `src-tauri/Cargo.toml`
   - `src/components/layout/UltraStatusBar.tsx`
   - `src/components/dialogs/UltraAboutDialog.tsx`
3. Update this VERSION_CONTROL.md file
4. Archive previous version with ARCHIVED marker
5. Test new version thoroughly

---

*Last Updated: 2025-01-06*
*Current Active Version: v1.0.3*
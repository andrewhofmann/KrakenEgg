# User Feedback Requirements

## Important UI/UX Requirements Based on User Feedback

### 1. Keyboard Navigation Accuracy (CRITICAL)
**Requirement**: Arrow key navigation must move to immediately adjacent files/folders in visual order
- **Issue**: Up/down arrow keys were jumping in strange steps instead of moving to adjacent items
- **Root Cause**: Mismatch between unsorted `panel.files` used by keyboard navigation vs sorted `sortedFiles` used by UI
- **Solution**: Keyboard navigation must use same filtering and sorting logic as UI display
- **Status**: ✅ RESOLVED - Updated `useKeyboardNavigation.ts` to use `sortedFiles`

### 2. Click-to-Deselect Behavior (HIGH PRIORITY)
**Requirement**: Clicking an already selected file/folder should deselect it
- **User Expectation**: Single-click toggle behavior for file selection
- **Implementation**: If file is selected and it's the only selection, clicking should deselect it
- **Status**: ✅ RESOLVED - Added toggle logic in `UltraFileList.tsx`

### 3. UI Consolidation - Path Actions (MEDIUM PRIORITY)
**Requirement**: Combine multiple action buttons into single function button for cleaner UI
- **Specific Case**: Three dots (···) and pencil (edit) buttons next to path should be combined
- **Solution**: Single dropdown menu with both "Show full path" and "Edit path" options
- **Status**: ✅ RESOLVED - Implemented combined dropdown in `UltraDirectoryPath.tsx`

### 4. Auto-Scroll for Keyboard Navigation (HIGH PRIORITY)
**Requirement**: Automatic scrolling when keyboard navigation goes beyond visible screen area
- **User Expectation**: List should automatically scroll to keep focused item visible
- **Implementation**: Enhanced `scrollIntoView()` behavior for keyboard navigation
- **Status**: 🔄 IN PROGRESS - Enhancing existing scroll logic

### 5. Archive/Compressed File Navigation (CRITICAL)
**Requirement**: Explore and manipulate compressed files as if they were folders
- **Core Functionality**: Navigate inside compressed files (ZIP, RAR, 7Z, TAR, etc.) seamlessly
- **File Operations**: Full file operation support within archives:
  - Copy files from/to archives
  - Move files within archives
  - Extract individual files or folders
  - Delete files from archives
  - Rename files within archives
  - Create new files/folders inside archives
- **User Experience**: Transparent archive browsing - user shouldn't notice difference between folder and archive
- **Performance**: Efficient handling of large archives without extracting entire contents
- **Status**: 📋 SPECIFICATION - Needs implementation

## Technical Implementation Guidelines

### Navigation Consistency
- Always use filtered and sorted file arrays for navigation calculations
- Maintain visual consistency between UI display and keyboard navigation behavior
- Ensure keyboard shortcuts follow Total Commander conventions while respecting macOS UX patterns

### Selection Behavior
- Implement smart toggle logic for single-click selections
- Preserve multi-selection capabilities (Cmd+click, Shift+click)
- Clear visual feedback for selection states

### UI Consolidation Principles
- Reduce UI clutter by combining related functions
- Use dropdown menus for multiple related actions
- Maintain accessibility through proper keyboard navigation and screen reader support

### Auto-Scroll Requirements
- Smooth scrolling behavior (`behavior: 'smooth'`)
- Intelligent positioning (`block: 'nearest'` or `block: 'center'` based on context)
- Performance optimization for large file lists
- Respect user motion preferences (prefers-reduced-motion)

## Priority Matrix

| Requirement | Impact | Difficulty | Priority |
|------------|--------|------------|----------|
| Keyboard Navigation Accuracy | HIGH | LOW | CRITICAL |
| Archive/Compressed File Navigation | HIGH | HIGH | CRITICAL |
| Click-to-Deselect | MEDIUM | LOW | HIGH |
| Auto-Scroll Navigation | HIGH | MEDIUM | HIGH |
| UI Consolidation | LOW | LOW | MEDIUM |

## Testing Requirements

### Keyboard Navigation Testing
- Test with various file list sizes (10, 100, 1000+ files)
- Test with different sorting options (name, size, date, type)
- Test with hidden files shown/hidden
- Test with empty directories

### Selection Testing
- Test single-click toggle behavior
- Test multi-selection preservation
- Test keyboard + mouse interaction
- Test focus vs selection states

### Auto-Scroll Testing
- Test navigation beyond visible area (top and bottom)
- Test with different view modes (brief, detailed, thumbnails)
- Test with different window sizes
- Test smooth scrolling performance

## Future Considerations

### Accessibility
- Ensure all interactions work with screen readers
- Maintain keyboard-only operation capability
- Respect system accessibility preferences

### Performance
- Optimize for large file lists (10,000+ files)
- Minimize reflows during navigation
- Efficient virtual scrolling implementation

### Cross-Platform Consistency
- Maintain core behavior across macOS, Windows, Linux
- Adapt platform-specific UX patterns where appropriate
- Consistent keyboard shortcuts with platform conventions

### Archive Integration Testing
- Test navigation inside various archive formats (ZIP, RAR, 7Z, TAR.GZ, etc.)
- Test file operations within archives (copy, move, delete, rename)
- Test mixed operations (archive to folder, folder to archive)
- Test large archive performance and memory usage
- Test nested archive support (archive within archive)
- Test password-protected archive handling
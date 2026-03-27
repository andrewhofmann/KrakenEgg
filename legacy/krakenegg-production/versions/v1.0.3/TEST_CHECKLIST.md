# KrakenEgg v1.0.2 Bug Testing Checklist

## Testing Progress
- **Started:** 2025-10-04
- **Total Items:** 125
- **Completed:** 0
- **Bugs Found:** 0
- **Status:** In Progress

## Test Results Log
| #  | Test Description | Status | Bug Found | Severity | Notes |
|----|------------------|--------|-----------|----------|-------|
| 1  | Panel width consistency with long filenames | ✅ | No | - | Fixed in current version |
| 2  | Navigate to root directory (/) | ✅ | No | - | Backend supports root navigation |
| 3  | Navigate to home directory (~) | ✅ | No | - | Backend has tilde expansion |
| 4  | Navigate using parent directory (..) | 🔍 | TESTING | - | Need to verify parent navigation |
| 5  | Navigate to deeply nested directories | 🔍 | TESTING | - | Testing with /tmp/krakenegg-test-dir |
| 6  | Special characters in directory names | 🔍 | TESTING | - | Created test dirs with spaces, special chars, Unicode |
| 7  | Unicode characters in paths | 🔍 | TESTING | - | Testing 中文 directories |
| 8  | Very long directory names | 🔍 | TESTING | - | Testing 150+ char directory names |
| 9  | Non-existent path handling | ⚠️ | PENDING | - | Need to test error handling |
| 10 | Archive operations | 🐛 | Yes | Medium | Backend has TODO!() macros that will panic |

---

## Core Navigation Tests (1-20)

### File System Navigation
1. ✅ Test panel width consistency with long filenames
2. [ ] Navigate to root directory (/)
3. [ ] Navigate to home directory (~)
4. [ ] Navigate using parent directory (..)
5. [ ] Navigate to deeply nested directories (>10 levels)
6. [ ] Navigate to directories with special characters (!@#$%^&*()_+)
7. [ ] Navigate to directories with Unicode characters (émojis, 中文, العربية)
8. [ ] Navigate to directories with very long names (>255 chars)
9. [ ] Navigate to directories with spaces in names
10. [ ] Navigate to symlinked directories
11. [ ] Navigate to mounted volumes/drives
12. [ ] Navigate to network shares (if applicable)
13. [ ] Navigate to system directories (/System, /usr, /etc)
14. [ ] Navigate to hidden directories (.git, .config)
15. [ ] Navigate to empty directories
16. [ ] Navigate between left and right panels
17. [ ] Test Tab key switching between panels
18. [ ] Test clicking to activate panels
19. [ ] Test rapid navigation (click multiple directories quickly)
20. [ ] Test navigation while files are loading

## File Display Tests (21-40)

### File List Rendering
21. [ ] Display files in directories with 1000+ files
22. [ ] Display files with very long names (>255 chars)
23. [ ] Display files with Unicode characters in names
24. [ ] Display files with special characters in names
25. [ ] Display hidden files (dot files)
26. [ ] Display system files
27. [ ] Display symlinked files
28. [ ] Display broken symlinks
29. [ ] Display files with no extensions
30. [ ] Display files with multiple extensions (.tar.gz)
31. [ ] Display files with only extensions (.gitignore)
32. [ ] Display empty files (0 bytes)
33. [ ] Display very large files (>1GB)
34. [ ] Display files with unusual permissions
35. [ ] Display recently modified files
36. [ ] Display files from different time zones
37. [ ] Display files with future timestamps
38. [ ] Display files with corrupted metadata
39. [ ] Test file icon rendering for different types
40. [ ] Test file size formatting (B, KB, MB, GB, TB)

## Selection and Interaction Tests (41-60)

### File Selection
41. [ ] Single click file selection
42. [ ] Double click file opening/navigation
43. [ ] Multi-select with Ctrl+click
44. [ ] Multi-select with Shift+click (range selection)
45. [ ] Select all files (Ctrl+A)
46. [ ] Deselect files by clicking empty space
47. [ ] Selection persistence when navigating
48. [ ] Selection across different panels
49. [ ] Select files with keyboard (arrow keys)
50. [ ] Select files with keyboard (Page Up/Down)
51. [ ] Select files with keyboard (Home/End)
52. [ ] Selection with very long file lists
53. [ ] Selection state visual feedback
54. [ ] Selection counter accuracy
55. [ ] Focus indication (highlighted file)
56. [ ] Focus movement with keyboard navigation
57. [ ] Right-click context menu (if implemented)
58. [ ] Drag and drop selection (if implemented)
59. [ ] Selection memory when switching panels
60. [ ] Selection limits (maximum files selected)

## Keyboard Navigation Tests (61-80)

### Keyboard Shortcuts
61. [ ] Arrow keys (Up/Down) navigation
62. [ ] Arrow keys (Left/Right) panel switching
63. [ ] Tab key panel switching
64. [ ] Enter key directory navigation
65. [ ] Backspace parent directory navigation
66. [ ] Home key (first file)
67. [ ] End key (last file)
68. [ ] Page Up/Down navigation
69. [ ] Ctrl+Home (top of list)
70. [ ] Ctrl+End (bottom of list)
71. [ ] F1-F12 function keys (if implemented)
72. [ ] Ctrl+C copy (if implemented)
73. [ ] Ctrl+V paste (if implemented)
74. [ ] Ctrl+X cut (if implemented)
75. [ ] Delete key (if implemented)
76. [ ] Escape key (cancel operations)
77. [ ] Space key (file preview - if implemented)
78. [ ] Alphanumeric quick search
79. [ ] Keyboard shortcuts in different languages
80. [ ] Keyboard shortcuts with modifier combinations

## UI Layout Tests (81-100)

### Interface Components
81. [ ] Title bar display and content
82. [ ] Toolbar button functionality
83. [ ] Status bar information accuracy
84. [ ] Panel headers (path display)
85. [ ] Panel borders and separators
86. [ ] Scrollbar functionality in long lists
87. [ ] Horizontal scrolling (if needed)
88. [ ] Window resizing behavior
89. [ ] Window minimizing/maximizing
90. [ ] Full screen mode (if supported)
91. [ ] Multiple window instances
92. [ ] Panel splitter dragging (if implemented)
93. [ ] Menu bar functionality (if exists)
94. [ ] Tooltip display and accuracy
95. [ ] Error message display
96. [ ] Loading indicators
97. [ ] Progress bars (if implemented)
98. [ ] Dark mode/theme switching (if implemented)
99. [ ] Font size scaling
100. [ ] UI element alignment and spacing

## Error Handling Tests (101-115)

### Error Scenarios
101. [ ] Access denied directories
102. [ ] Non-existent paths
103. [ ] Corrupted file systems
104. [ ] Network timeouts (if applicable)
105. [ ] Disk full scenarios
106. [ ] Permission denied errors
107. [ ] Path too long errors
108. [ ] Invalid characters in paths
109. [ ] Concurrent file modifications
110. [ ] System resource exhaustion
111. [ ] Application crash recovery
112. [ ] Memory leak detection
113. [ ] Performance with large directories
114. [ ] Handling of locked files
115. [ ] Unicode handling errors

## Performance Tests (116-125)

### Performance Scenarios
116. [ ] Loading directories with 10,000+ files
117. [ ] Memory usage with large file lists
118. [ ] CPU usage during navigation
119. [ ] Response time for directory changes
120. [ ] Scroll performance in large lists
121. [ ] Search performance (if implemented)
122. [ ] File thumbnail generation (if implemented)
123. [ ] Background task performance
124. [ ] Application startup time
125. [ ] Resource cleanup on exit

---

## Bug Severity Levels
- **Critical:** Application crashes, data loss, security issues
- **High:** Major functionality broken, UI unusable
- **Medium:** Minor functionality issues, poor UX
- **Low:** Cosmetic issues, minor inconsistencies

## Test Environment
- **OS:** macOS (Darwin 25.0.0)
- **App Version:** KrakenEgg v1.0.2
- **Test URL:** http://localhost:3011/
- **Date:** 2025-10-04
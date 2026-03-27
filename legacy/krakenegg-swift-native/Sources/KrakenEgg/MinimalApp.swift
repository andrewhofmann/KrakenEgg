import SwiftUI
import AppKit
import Carbon
import ApplicationServices

@main
struct MinimalKrakenEggApp: App {
    @StateObject private var globalKeyHandler = GlobalKeyboardHandler()

    var body: some Scene {
        WindowGroup {
            KrakenEggFileManager()
                .environmentObject(globalKeyHandler)
        }
        .windowStyle(.titleBar)
    }
}

struct KrakenEggFileManager: View {
    @StateObject private var leftPanelState = PanelState()
    @StateObject private var rightPanelState = PanelState()
    @State private var activePanel: PanelSide = .left
    @State private var cursorLocation: CGPoint = .zero
    @State private var isNearWindowEdge = false
    @State private var edgeProximityTimer: Timer?
    @FocusState private var isKeyboardFocused: Bool
    @EnvironmentObject private var globalKeyHandler: GlobalKeyboardHandler

    var body: some View {
        VStack(spacing: 0) {
            // Toolbar at the top
            KrakenEggToolbar(
                leftPanelState: leftPanelState,
                rightPanelState: rightPanelState,
                activePanel: $activePanel
            )

            // Main dual-panel area
            HSplitView {
                FilePanel(
                    panelState: leftPanelState,
                    isActive: activePanel == .left,
                    onActivate: { activePanel = .left }
                )
                .frame(minWidth: 400)

                FilePanel(
                    panelState: rightPanelState,
                    isActive: activePanel == .right,
                    onActivate: { activePanel = .right }
                )
                .frame(minWidth: 400)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            // Function key bar at the bottom
            FunctionKeyBar(
                leftPanelState: leftPanelState,
                rightPanelState: rightPanelState,
                activePanel: $activePanel
            )

            // Status bar at the very bottom
            StatusBar(
                leftPanelState: leftPanelState,
                rightPanelState: rightPanelState,
                activePanel: $activePanel
            )
        }
        .frame(minWidth: 800, minHeight: 600)
        .focused($isKeyboardFocused)
        .onAppear {
            leftPanelState.loadDirectory(FileSystemService.shared.getHomeDirectory())
            rightPanelState.loadDirectory(FileSystemService.shared.getCurrentDirectory())
            setupCursorTracking()
            setupGlobalKeyboardHandling()
            isKeyboardFocused = true
        }
        .onDisappear {
            edgeProximityTimer?.invalidate()
            globalKeyHandler.stopMonitoring()
        }
        .focusable() // Ensure the view can receive keyboard focus
        .background(
            // macOS 26 enhanced background with edge detection visual feedback
            isNearWindowEdge ?
            LinearGradient(colors: [.blue.opacity(0.05), .clear], startPoint: .topLeading, endPoint: .bottomTrailing) :
            LinearGradient(colors: [.clear], startPoint: .topLeading, endPoint: .bottomTrailing)
        )
    }


    // MARK: - macOS 26 Cursor Edge Detection

    private func setupCursorTracking() {
        // Enhanced cursor tracking for macOS 26 (Tahoe) with edge detection
        edgeProximityTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
            updateCursorLocation()
        }
    }

    private func updateCursorLocation() {
        guard let window = NSApplication.shared.mainWindow else { return }

        let mouseLocation = NSEvent.mouseLocation
        let windowFrame = window.frame
        let localPoint = CGPoint(
            x: mouseLocation.x - windowFrame.origin.x,
            y: mouseLocation.y - windowFrame.origin.y
        )

        cursorLocation = localPoint

        // Detect proximity to window edges (within 20 pixels)
        let edgeThreshold: CGFloat = 20
        let nearLeftEdge = localPoint.x <= edgeThreshold
        let nearRightEdge = localPoint.x >= windowFrame.width - edgeThreshold
        let nearTopEdge = localPoint.y >= windowFrame.height - edgeThreshold
        let nearBottomEdge = localPoint.y <= edgeThreshold

        let wasNearEdge = isNearWindowEdge
        isNearWindowEdge = nearLeftEdge || nearRightEdge || nearTopEdge || nearBottomEdge

        // Trigger haptic feedback when entering edge zone (macOS 26 feature)
        if isNearWindowEdge && !wasNearEdge {
            NSHapticFeedbackManager.defaultPerformer.perform(.generic, performanceTime: .default)
        }
    }

    // MARK: - Global Keyboard Handling Setup

    private func setupGlobalKeyboardHandling() {
        print("🎹 Setting up global keyboard monitoring...")

        // Configure the global keyboard handler with our navigation logic
        globalKeyHandler.onKeyEvent = { [self] keyCode, modifiers in
            let activeState = activePanel == .left ? leftPanelState : rightPanelState
            let isShiftPressed = modifiers.contains(.shift)

            switch keyCode {
            case 125: // Down Arrow
                print("🔽 Global Down arrow pressed - Moving selection down (shift: \(isShiftPressed))")
                DispatchQueue.main.async {
                    let newIndex = min(activeState.selectedIndex + 1, activeState.files.count - 1)
                    activeState.handleShiftSelection(newIndex: newIndex, isShiftPressed: isShiftPressed)
                }
                return true
            case 126: // Up Arrow
                print("🔼 Global Up arrow pressed - Moving selection up (shift: \(isShiftPressed))")
                DispatchQueue.main.async {
                    let newIndex = max(activeState.selectedIndex - 1, 0)
                    activeState.handleShiftSelection(newIndex: newIndex, isShiftPressed: isShiftPressed)
                }
                return true
            case 36: // Return/Enter
                print("⏎ Global Return pressed - Handling return (path editing: \(activeState.isPathEditing))")
                DispatchQueue.main.async {
                    if activeState.isPathEditing {
                        activeState.commitPathEdit()
                    } else {
                        activeState.navigateToSelected()
                    }
                }
                return true
            case 48: // Tab
                print("⇥ Global Tab pressed - Switching panels")
                DispatchQueue.main.async {
                    // Clear selection from previous active panel
                    activeState.clearSelection()
                    // Switch active panel
                    activePanel = activePanel == .left ? .right : .left
                }
                return true
            case 53: // Escape
                print("⎋ Global Escape pressed - Handling escape")
                DispatchQueue.main.async {
                    if activeState.isPathEditing {
                        activeState.cancelPathEdit()
                    } else if !activeState.selectedItems.isEmpty {
                        activeState.clearSelection()
                    } else {
                        let parentPath = URL(fileURLWithPath: activeState.currentPath).deletingLastPathComponent().path
                        activeState.loadDirectory(parentPath)
                    }
                }
                return true
            default:
                return false
            }
        }

        globalKeyHandler.startMonitoring()
    }

}

enum PanelSide {
    case left, right
}

class PanelState: ObservableObject {
    @Published var currentPath: String = ""
    @Published var files: [FileItem] = []
    @Published var selectedIndex: Int = 0
    @Published var selectedItems: Set<Int> = []
    @Published var selectionAnchor: Int? = nil
    @Published var isLoading: Bool = false
    @Published var sortColumn: SortColumn = .name
    @Published var sortAscending: Bool = true
    @Published var isPathEditing: Bool = false
    @Published var editingPath: String = ""

    enum SortColumn {
        case name, size, date, type
    }

    func loadDirectory(_ path: String) {
        isLoading = true
        currentPath = path
        editingPath = path
        selectedItems.removeAll()
        selectionAnchor = nil

        DispatchQueue.global(qos: .userInitiated).async {
            let items = FileSystemService.shared.listDirectory(at: path)

            DispatchQueue.main.async {
                self.files = self.sortFiles(items)
                self.selectedIndex = 0
                self.isLoading = false
            }
        }
    }

    private func sortFiles(_ files: [FileItem]) -> [FileItem] {
        return files.sorted { file1, file2 in
            // Parent directory (..) always comes first
            if file1.name == ".." { return true }
            if file2.name == ".." { return false }

            // Directories come before files
            if file1.isDirectory != file2.isDirectory {
                return file1.isDirectory
            }

            let result: Bool
            switch sortColumn {
            case .name:
                result = file1.name.localizedCompare(file2.name) == .orderedAscending
            case .size:
                result = file1.size < file2.size
            case .date:
                result = file1.modified < file2.modified
            case .type:
                let ext1 = file1.`extension` ?? ""
                let ext2 = file2.`extension` ?? ""
                result = ext1.localizedCompare(ext2) == .orderedAscending
            }

            return sortAscending ? result : !result
        }
    }

    func clearSelection() {
        selectedItems.removeAll()
        selectionAnchor = nil
    }

    func selectRange(from: Int, to: Int) {
        let start = min(from, to)
        let end = max(from, to)
        selectedItems = Set(start...end)
    }

    func handleShiftSelection(newIndex: Int, isShiftPressed: Bool) {
        // Ensure newIndex is within bounds
        guard newIndex >= 0 && newIndex < files.count else { return }

        if isShiftPressed {
            // If we don't have an anchor, use the current selected index as anchor
            if selectionAnchor == nil {
                selectionAnchor = selectedIndex
            }

            if let anchor = selectionAnchor {
                selectRange(from: anchor, to: newIndex)
            }
        } else {
            // Not holding shift - clear multi-selection and move cursor
            clearSelection()
            selectionAnchor = nil
        }
        selectedIndex = newIndex
    }

    func startPathEditing() {
        editingPath = currentPath
        isPathEditing = true
    }

    func commitPathEdit() {
        isPathEditing = false
        let trimmedPath = editingPath.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedPath.isEmpty && FileManager.default.fileExists(atPath: trimmedPath) {
            loadDirectory(trimmedPath)
        } else {
            editingPath = currentPath
        }
    }

    func cancelPathEdit() {
        isPathEditing = false
        editingPath = currentPath
    }

    func setSortColumn(_ column: SortColumn) {
        if sortColumn == column {
            sortAscending.toggle()
        } else {
            sortColumn = column
            sortAscending = true
        }
        files = sortFiles(files)
    }

    func navigateToSelected() {
        guard selectedIndex < files.count else { return }
        let selectedFile = files[selectedIndex]

        if selectedFile.isDirectory {
            loadDirectory(selectedFile.path)
        }
    }

    func moveSelection(by offset: Int) {
        let newIndex = selectedIndex + offset
        if newIndex >= 0 && newIndex < files.count {
            selectedIndex = newIndex
        }
    }

    func toggleSelection(at index: Int) {
        if selectedItems.contains(index) {
            selectedItems.remove(index)
        } else {
            selectedItems.insert(index)
        }
    }


    func selectAll() {
        selectedItems = Set(0..<files.count)
    }

    func getSelectedFiles() -> [FileItem] {
        return selectedItems.compactMap { index in
            guard index < files.count else { return nil }
            return files[index]
        }
    }
}

struct FilePanel: View {
    @ObservedObject var panelState: PanelState
    let isActive: Bool
    let onActivate: () -> Void
    @State private var lastSelectedIndex: Int = 0

    var body: some View {
        VStack(spacing: 0) {
            // Path bar - editable on double-click
            HStack {
                if panelState.isPathEditing {
                    TextField("Path", text: $panelState.editingPath)
                        .textFieldStyle(.plain)
                        .font(.caption)
                        .foregroundColor(.primary)
                        .padding(.horizontal)
                        .onSubmit {
                            panelState.commitPathEdit()
                        }
                        .onExitCommand {
                            panelState.cancelPathEdit()
                        }
                        .onAppear {
                            // Select all text when editing starts
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                                if let textField = NSApp.keyWindow?.firstResponder as? NSTextView {
                                    textField.selectAll(nil)
                                }
                            }
                        }
                } else {
                    Text(panelState.currentPath)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.horizontal)
                        .onTapGesture(count: 2) {
                            panelState.startPathEditing()
                        }
                }
                Spacer()
            }
            .frame(height: 24)
            .background(Color(NSColor.controlBackgroundColor))

            // Column Headers
            ColumnHeaderView(panelState: panelState)

            // File list
            if panelState.isLoading {
                HStack {
                    ProgressView()
                        .scaleEffect(0.8)
                    Text("Loading...")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollViewReader { proxy in
                    List(panelState.files.indices, id: \.self) { index in
                        FileRowView(
                            file: panelState.files[index],
                            isSelected: isActive && index == panelState.selectedIndex,
                            isMultiSelected: isActive && panelState.selectedItems.contains(index),
                            rowIndex: index
                        )
                        .onTapGesture(count: 1) {
                            handleSelection(index: index)
                        }
                        .onDoubleClick {
                            panelState.selectedIndex = index
                            panelState.navigateToSelected()
                        }
                        .contextMenu {
                            Button("Copy") { /* TODO: Implement copy */ }
                            Button("Move") { /* TODO: Implement move */ }
                            Button("Delete") { /* TODO: Implement delete */ }
                            Divider()
                            Button("Properties") { /* TODO: Show properties */ }
                        }
                        .id(index)
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                    .onChange(of: panelState.selectedIndex) { _, newIndex in
                        withAnimation(.easeInOut(duration: 0.2)) {
                            proxy.scrollTo(newIndex, anchor: .center)
                        }
                    }
                }
            }
        }
        .background(isActive ? Color.blue.opacity(0.1) : Color.clear)
        .border(isActive ? Color.blue : Color.gray, width: 1)
        .onTapGesture {
            onActivate()
        }
    }

    private func handleSelection(index: Int) {
        let modifiers = NSApp.currentEvent?.modifierFlags ?? []

        if modifiers.contains(.command) {
            // Cmd+click: Toggle individual selection
            panelState.toggleSelection(at: index)
            panelState.selectedIndex = index
        } else if modifiers.contains(.shift) {
            // Shift+click: Range selection
            panelState.selectRange(from: lastSelectedIndex, to: index)
            panelState.selectedIndex = index
        } else {
            // Normal click: Single selection
            panelState.clearSelection()
            panelState.selectedIndex = index
            lastSelectedIndex = index
        }
        onActivate()
    }
}

struct ColumnHeaderView: View {
    @ObservedObject var panelState: PanelState

    var body: some View {
        HStack(spacing: 0) {
            // Icon column
            Button(action: {}) {
                Image(systemName: "doc")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
                    .frame(width: 20)
            }
            .buttonStyle(PlainButtonStyle())

            // Name column
            Button(action: { panelState.setSortColumn(.name) }) {
                HStack(spacing: 4) {
                    Text("Name")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.primary)

                    if panelState.sortColumn == .name {
                        Image(systemName: panelState.sortAscending ? "chevron.up" : "chevron.down")
                            .font(.system(size: 8))
                            .foregroundColor(.secondary)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 8)
            }
            .buttonStyle(PlainButtonStyle())

            Divider()

            // Size column
            Button(action: { panelState.setSortColumn(.size) }) {
                HStack(spacing: 4) {
                    Text("Size")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.primary)

                    if panelState.sortColumn == .size {
                        Image(systemName: panelState.sortAscending ? "chevron.up" : "chevron.down")
                            .font(.system(size: 8))
                            .foregroundColor(.secondary)
                    }
                }
                .frame(width: 80, alignment: .trailing)
                .padding(.horizontal, 8)
            }
            .buttonStyle(PlainButtonStyle())

            Divider()

            // Date column
            Button(action: { panelState.setSortColumn(.date) }) {
                HStack(spacing: 4) {
                    Text("Date")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.primary)

                    if panelState.sortColumn == .date {
                        Image(systemName: panelState.sortAscending ? "chevron.up" : "chevron.down")
                            .font(.system(size: 8))
                            .foregroundColor(.secondary)
                    }
                }
                .frame(width: 100, alignment: .trailing)
                .padding(.horizontal, 8)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .frame(height: 20)
        .background(Color(NSColor.controlBackgroundColor))
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundColor(Color(NSColor.separatorColor)),
            alignment: .bottom
        )
    }
}

struct FileRowView: View {
    let file: FileItem
    let isSelected: Bool
    let isMultiSelected: Bool
    let rowIndex: Int

    var body: some View {
        HStack(spacing: 0) {
            // Icon column
            Image(systemName: finderIcon)
                .foregroundStyle(iconColor)
                .frame(width: 20, height: 16)
                .font(.system(size: 14, weight: .medium))

            // File name column
            Text(file.name)
                .font(.system(size: 13, weight: .regular, design: .default))
                .foregroundColor(file.isHidden ? .secondary : .primary)
                .lineLimit(1)
                .truncationMode(.middle)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 8)

            Divider()

            // Size column
            Text(file.isDirectory || file.name == ".." ? "" : file.displaySize)
                .font(.system(size: 11, weight: .regular))
                .foregroundColor(.secondary)
                .frame(width: 80, alignment: .trailing)
                .padding(.horizontal, 8)

            Divider()

            // Date column
            Text(DateFormatter.finderStyle.string(from: file.modified))
                .font(.system(size: 11, weight: .regular))
                .foregroundColor(.secondary)
                .frame(width: 100, alignment: .trailing)
                .padding(.horizontal, 8)
        }
        .frame(height: 20)
        .background(rowBackground)
        .contentShape(Rectangle())
    }

    private var rowBackground: Color {
        if isSelected {
            return Color.accentColor.opacity(0.8)
        } else if isMultiSelected {
            return Color.accentColor.opacity(0.4)
        } else if rowIndex % 2 == 0 {
            return Color.clear
        } else {
            return Color.primary.opacity(0.03) // Very subtle zebra stripe
        }
    }

    private var finderIcon: String {
        if file.name == ".." {
            return "folder.badge.questionmark"
        }

        if file.isDirectory {
            return "folder.fill"
        }

        if file.isArchive {
            return "archivebox.fill"
        }

        guard let ext = file.`extension`?.lowercased() else {
            return "doc.fill"
        }

        switch ext {
        // Images
        case "jpg", "jpeg", "png", "gif", "svg", "bmp", "tiff", "webp":
            return "photo.fill"
        case "heic", "heif":
            return "photo.on.rectangle"

        // Audio
        case "mp3", "m4a", "wav", "aac", "flac", "ogg":
            return "music.note"
        case "m4p", "m4b":
            return "music.note.list"

        // Video
        case "mp4", "mov", "avi", "mkv", "wmv", "flv", "webm":
            return "play.rectangle.fill"
        case "m4v":
            return "tv.fill"

        // Documents
        case "pdf":
            return "doc.richtext.fill"
        case "doc", "docx":
            return "doc.text.fill"
        case "xls", "xlsx":
            return "tablecells.fill"
        case "ppt", "pptx":
            return "rectangle.on.rectangle.angled"
        case "txt", "rtf":
            return "doc.plaintext.fill"

        // Code files
        case "swift":
            return "swift"
        case "py":
            return "doc.text.fill"
        case "js", "ts", "jsx", "tsx":
            return "curlybraces"
        case "html", "htm":
            return "globe"
        case "css":
            return "paintbrush.fill"
        case "json":
            return "curlybraces.square.fill"
        case "xml":
            return "chevron.left.forwardslash.chevron.right"

        // Executables and system files
        case "app":
            return "app.fill"
        case "dmg":
            return "internaldrive.fill"
        case "pkg":
            return "shippingbox.fill"
        case "deb", "rpm":
            return "cube.box.fill"

        // Other common formats
        case "md":
            return "text.alignleft"
        case "log":
            return "list.bullet.rectangle"

        default:
            return "doc.fill"
        }
    }

    private var iconColor: Color {
        if file.name == ".." {
            return .orange
        }

        if file.isDirectory {
            return .blue
        }

        if file.isArchive {
            return .purple
        }

        guard let ext = file.`extension`?.lowercased() else {
            return .secondary
        }

        switch ext {
        // Images - Green tones
        case "jpg", "jpeg", "png", "gif", "svg", "bmp", "tiff", "webp", "heic", "heif":
            return .green

        // Audio - Pink/Purple tones
        case "mp3", "m4a", "wav", "aac", "flac", "ogg", "m4p", "m4b":
            return .pink

        // Video - Red tones
        case "mp4", "mov", "avi", "mkv", "wmv", "flv", "webm", "m4v":
            return .red

        // Documents - Blue tones
        case "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf":
            return .blue

        // Code files - Orange tones
        case "swift", "py", "js", "ts", "jsx", "tsx", "html", "htm", "css", "json", "xml":
            return .orange

        // System/executable - Gray tones
        case "app", "dmg", "pkg", "deb", "rpm":
            return .primary

        default:
            return .secondary
        }
    }
}

extension DateFormatter {
    static let finderStyle: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        formatter.doesRelativeDateFormatting = true
        return formatter
    }()
}


extension View {
    func onDoubleClick(perform action: @escaping () -> Void) -> some View {
        self.onTapGesture(count: 2, perform: action)
    }
}

// MARK: - Global Keyboard Handler for System-Level Event Capture

class GlobalKeyboardHandler: ObservableObject {
    private var globalMonitor: Any?
    private var localMonitor: Any?

    var onKeyEvent: ((CGKeyCode, NSEvent.ModifierFlags) -> Bool)?

    func startMonitoring() {
        print("🎯 Starting global keyboard monitoring with high priority...")

        // Stop any existing monitors
        stopMonitoring()

        // Set up the app to become the active application immediately
        NSApplication.shared.activate(ignoringOtherApps: true)

        // Create and configure the main window to always be key
        if let mainWindow = NSApplication.shared.mainWindow {
            mainWindow.makeKeyAndOrderFront(nil)
            mainWindow.orderFrontRegardless()
            mainWindow.makeKey()
            print("🎯 KrakenEgg window made key and ordered front")
        }

        // Check if we have accessibility permissions for global monitoring
        let hasAccessibilityAccess = AXIsProcessTrusted()
        print("🔓 Accessibility permissions: \(hasAccessibilityAccess)")

        // Enhanced local monitor that aggressively captures events
        print("🔧 Setting up local event monitor...")
        localMonitor = NSEvent.addLocalMonitorForEvents(matching: [.keyDown, .keyUp]) { [weak self] event in
            guard let self = self else { return event }

            let keyCode = CGKeyCode(event.keyCode)
            let modifiers = event.modifierFlags
            print("🏠 Local monitor captured key: \(keyCode) (type: \(event.type.rawValue), modifiers: \(modifiers))")

            // Only handle keyDown events for our navigation
            if event.type == .keyDown {
                if let onKeyEvent = self.onKeyEvent {
                    let handled = onKeyEvent(keyCode, modifiers)
                    print("✅ Local key event \(keyCode) handled: \(handled)")
                    if handled {
                        return nil // Consume the event completely
                    }
                } else {
                    print("❌ No onKeyEvent handler available!")
                }
            }

            return event // Allow event to continue
        }

        if localMonitor != nil {
            print("✅ Local monitor set up successfully")
        } else {
            print("❌ Failed to set up local monitor")
        }

        // ULTRA-AGGRESSIVE global monitor (requires accessibility permissions)
        if hasAccessibilityAccess {
            print("🔧 Setting up ULTRA-AGGRESSIVE global event monitor...")
            globalMonitor = NSEvent.addGlobalMonitorForEvents(matching: [.keyDown, .keyUp]) { [weak self] event in
                guard let self = self else { return }

                let keyCode = CGKeyCode(event.keyCode)
                let modifiers = event.modifierFlags
                print("🌍 GLOBAL INTERCEPT: Key \(keyCode) (modifiers: \(modifiers)) - FORCE STEALING!")

                // For ANY navigation key, immediately steal focus and handle event
                if [125, 126, 36, 48, 53].contains(keyCode) && event.type == .keyDown {
                    print("🚨 CRITICAL KEY DETECTED: \(keyCode) - EMERGENCY FOCUS STEAL!")

                    // IMMEDIATE aggressive focus stealing
                    NSApplication.shared.activate(ignoringOtherApps: true)
                    if let mainWindow = NSApplication.shared.mainWindow {
                        mainWindow.makeKeyAndOrderFront(nil)
                        mainWindow.orderFrontRegardless()
                        mainWindow.makeKey()
                    }

                    // Handle the event IMMEDIATELY
                    DispatchQueue.main.async {
                        if let onKeyEvent = self.onKeyEvent {
                            let handled = onKeyEvent(keyCode, modifiers)
                            print("🔄 EMERGENCY handled global key \(keyCode): \(handled)")
                        }
                    }
                }
            }

            if globalMonitor != nil {
                print("✅ ULTRA-AGGRESSIVE global monitor ACTIVE")
            } else {
                print("❌ Failed to set up global monitor")
            }
        } else {
            print("⚠️ WARNING: No accessibility permissions - limited keyboard capture!")
            print("   Please enable Accessibility access for KrakenEgg in System Preferences")
        }

        // Continuous focus monitoring to ensure we stay active
        setupContinuousFocusMonitoring()

        print("✅ Enhanced global keyboard monitoring started")
        print("🎯 onKeyEvent handler is: \(onKeyEvent != nil ? "SET" : "NOT SET")")
    }

    private func setupContinuousFocusMonitoring() {
        // ULTRA-AGGRESSIVE focus monitoring to prevent other apps from stealing events
        print("🛡️ Setting up ultra-aggressive focus monitoring...")

        // High-frequency timer for immediate focus reclaim
        Timer.scheduledTimer(withTimeInterval: 0.05, repeats: true) { _ in
            if let mainWindow = NSApplication.shared.mainWindow {
                if !mainWindow.isKeyWindow {
                    print("🔄 EMERGENCY: Reclaiming keyboard focus immediately!")
                    mainWindow.makeKeyAndOrderFront(nil)
                    mainWindow.orderFrontRegardless()
                    NSApplication.shared.activate(ignoringOtherApps: true)
                    mainWindow.makeKey()
                }
            }
        }

        // Monitor for when other applications become active
        NSWorkspace.shared.notificationCenter.addObserver(
            forName: NSWorkspace.didActivateApplicationNotification,
            object: nil,
            queue: .main
        ) { notification in
            if let app = notification.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication {
                if app.bundleIdentifier != Bundle.main.bundleIdentifier {
                    print("⚠️ Other app became active: \(app.localizedName ?? "Unknown") - STEALING FOCUS BACK!")

                    // Immediately steal focus back
                    DispatchQueue.main.async {
                        NSApplication.shared.activate(ignoringOtherApps: true)
                        if let mainWindow = NSApplication.shared.mainWindow {
                            mainWindow.makeKeyAndOrderFront(nil)
                            mainWindow.orderFrontRegardless()
                            mainWindow.makeKey()
                        }
                    }
                }
            }
        }

        // Monitor for application resignation
        NotificationCenter.default.addObserver(
            forName: NSApplication.didResignActiveNotification,
            object: nil,
            queue: .main
        ) { _ in
            print("⚠️ KrakenEgg resigned active - RECLAIMING IMMEDIATELY!")
            DispatchQueue.main.async {
                NSApplication.shared.activate(ignoringOtherApps: true)
                if let mainWindow = NSApplication.shared.mainWindow {
                    mainWindow.makeKeyAndOrderFront(nil)
                    mainWindow.orderFrontRegardless()
                    mainWindow.makeKey()
                }
            }
        }

        // Monitor for window resignation
        NotificationCenter.default.addObserver(
            forName: NSWindow.didResignKeyNotification,
            object: nil,
            queue: .main
        ) { _ in
            print("⚠️ KrakenEgg window resigned key - RECLAIMING IMMEDIATELY!")
            DispatchQueue.main.async {
                NSApplication.shared.activate(ignoringOtherApps: true)
                if let mainWindow = NSApplication.shared.mainWindow {
                    mainWindow.makeKeyAndOrderFront(nil)
                    mainWindow.orderFrontRegardless()
                    mainWindow.makeKey()
                }
            }
        }

        print("🛡️ Ultra-aggressive focus monitoring established!")
    }

    func stopMonitoring() {
        if let globalMonitor = globalMonitor {
            NSEvent.removeMonitor(globalMonitor)
            self.globalMonitor = nil
            print("🛑 Global monitor stopped")
        }

        if let localMonitor = localMonitor {
            NSEvent.removeMonitor(localMonitor)
            self.localMonitor = nil
            print("🛑 Local monitor stopped")
        }
    }

    deinit {
        stopMonitoring()
    }
}


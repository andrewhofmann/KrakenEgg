import SwiftUI

struct FunctionKeyBar: View {
    @ObservedObject var leftPanelState: PanelState
    @ObservedObject var rightPanelState: PanelState
    @Binding var activePanel: PanelSide
    @State private var pressedModifiers: Set<ModifierKey> = []

    enum ModifierKey {
        case shift, command, control, option
    }

    var body: some View {
        HStack(spacing: 0) {
            ForEach(1...10, id: \.self) { fKeyNumber in
                FunctionKeyButton(
                    number: fKeyNumber,
                    label: getFunctionKeyLabel(fKeyNumber),
                    action: { performFunctionKeyAction(fKeyNumber) }
                )
            }
        }
        .frame(height: 32)
        .background(Color(NSColor.controlBackgroundColor))
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundColor(Color(NSColor.separatorColor)),
            alignment: .top
        )
        .onReceive(NotificationCenter.default.publisher(for: .flagsChanged)) { notification in
            updateModifierKeys(notification)
        }
    }

    private func getFunctionKeyLabel(_ number: Int) -> String {
        if pressedModifiers.contains(.shift) {
            return getShiftFunctionLabel(number)
        } else if pressedModifiers.contains(.command) {
            return getCommandFunctionLabel(number)
        } else if pressedModifiers.contains(.control) {
            return getControlFunctionLabel(number)
        } else if pressedModifiers.contains(.option) {
            return getOptionFunctionLabel(number)
        } else {
            return getDefaultFunctionLabel(number)
        }
    }

    private func getDefaultFunctionLabel(_ number: Int) -> String {
        switch number {
        case 1: return "Help"
        case 2: return "Rename"
        case 3: return "View"
        case 4: return "Edit"
        case 5: return "Copy"
        case 6: return "Move"
        case 7: return "NewDir"
        case 8: return "Delete"
        case 9: return "Menu"
        case 10: return "Quit"
        default: return "F\(number)"
        }
    }

    private func getShiftFunctionLabel(_ number: Int) -> String {
        switch number {
        case 1: return "CmpList"
        case 2: return "Compare"
        case 3: return "CmpName"
        case 4: return "NewFile"
        case 5: return "CpyName"
        case 6: return "RenMov"
        case 7: return "NewFldr"
        case 8: return "DelPerm"
        case 9: return "Config"
        case 10: return "Context"
        default: return "S-F\(number)"
        }
    }

    private func getCommandFunctionLabel(_ number: Int) -> String {
        switch number {
        case 1: return "Brief"
        case 2: return "Detail"
        case 3: return "Tree"
        case 4: return "Custom"
        case 5: return "CpyPath"
        case 6: return "MovPath"
        case 7: return "Search"
        case 8: return "Recycle"
        case 9: return "Network"
        case 10: return "Archive"
        default: return "⌘F\(number)"
        }
    }

    private func getControlFunctionLabel(_ number: Int) -> String {
        switch number {
        case 1: return "SortNm"
        case 2: return "SortSz"
        case 3: return "SortDt"
        case 4: return "SortTp"
        case 5: return "Refresh"
        case 6: return "Hidden"
        case 7: return "Filter"
        case 8: return "Select"
        case 9: return "Deselct"
        case 10: return "InvSel"
        default: return "^F\(number)"
        }
    }

    private func getOptionFunctionLabel(_ number: Int) -> String {
        switch number {
        case 1: return "LeftDrv"
        case 2: return "RightDrv"
        case 3: return "Histy"
        case 4: return "DirHist"
        case 5: return "Pack"
        case 6: return "Unpack"
        case 7: return "Test"
        case 8: return "SyncDir"
        case 9: return "FTP"
        case 10: return "Split"
        default: return "⌥F\(number)"
        }
    }

    private func performFunctionKeyAction(_ number: Int) {
        if pressedModifiers.contains(.shift) {
            performShiftFunctionAction(number)
        } else if pressedModifiers.contains(.command) {
            performCommandFunctionAction(number)
        } else if pressedModifiers.contains(.control) {
            performControlFunctionAction(number)
        } else if pressedModifiers.contains(.option) {
            performOptionFunctionAction(number)
        } else {
            performDefaultFunctionAction(number)
        }
    }

    private func performDefaultFunctionAction(_ number: Int) {
        let activeState = activePanel == .left ? leftPanelState : rightPanelState

        switch number {
        case 1: // Help
            showHelp()
        case 2: // Rename
            renameSelectedFile()
        case 3: // View
            viewSelectedFile()
        case 4: // Edit
            editSelectedFile()
        case 5: // Copy
            copySelectedFiles()
        case 6: // Move
            moveSelectedFiles()
        case 7: // New Directory
            createNewDirectory()
        case 8: // Delete
            deleteSelectedFiles()
        case 9: // Menu
            showMenu()
        case 10: // Quit
            quitApplication()
        default:
            break
        }
    }

    private func performShiftFunctionAction(_ number: Int) {
        switch number {
        case 4: // New File
            createNewFile()
        case 8: // Permanent Delete
            permanentDeleteSelectedFiles()
        default:
            break
        }
    }

    private func performCommandFunctionAction(_ number: Int) {
        let activeState = activePanel == .left ? leftPanelState : rightPanelState

        switch number {
        case 1: // Brief View
            // TODO: Switch to brief view mode
            break
        case 2: // Detail View
            // TODO: Switch to detail view mode
            break
        case 5: // Copy Path
            copySelectedFilePaths()
        case 7: // Search
            showSearchDialog()
        default:
            break
        }
    }

    private func performControlFunctionAction(_ number: Int) {
        let activeState = activePanel == .left ? leftPanelState : rightPanelState

        switch number {
        case 1: // Sort by Name
            // TODO: Sort by name
            break
        case 2: // Sort by Size
            // TODO: Sort by size
            break
        case 3: // Sort by Date
            // TODO: Sort by date
            break
        case 4: // Sort by Type
            // TODO: Sort by type
            break
        case 5: // Refresh
            activeState.loadDirectory(activeState.currentPath)
        default:
            break
        }
    }

    private func performOptionFunctionAction(_ number: Int) {
        switch number {
        case 5: // Pack (Create Archive)
            createArchive()
        case 6: // Unpack (Extract Archive)
            extractArchive()
        default:
            break
        }
    }

    // MARK: - Action Implementations

    private func showHelp() {
        // TODO: Show help dialog
        print("Show Help")
    }

    private func renameSelectedFile() {
        // TODO: Rename selected file
        print("Rename File")
    }

    private func viewSelectedFile() {
        // TODO: View selected file
        print("View File")
    }

    private func editSelectedFile() {
        // TODO: Edit selected file
        print("Edit File")
    }

    private func copySelectedFiles() {
        // TODO: Copy files to opposite panel
        print("Copy Files")
    }

    private func moveSelectedFiles() {
        // TODO: Move files to opposite panel
        print("Move Files")
    }

    private func createNewDirectory() {
        // TODO: Create new directory
        print("Create New Directory")
    }

    private func deleteSelectedFiles() {
        // TODO: Delete selected files
        print("Delete Files")
    }

    private func showMenu() {
        // TODO: Show application menu
        print("Show Menu")
    }

    private func quitApplication() {
        NSApplication.shared.terminate(nil)
    }

    private func createNewFile() {
        // TODO: Create new file
        print("Create New File")
    }

    private func permanentDeleteSelectedFiles() {
        // TODO: Permanently delete files
        print("Permanent Delete")
    }

    private func copySelectedFilePaths() {
        // TODO: Copy file paths to clipboard
        print("Copy Paths")
    }

    private func showSearchDialog() {
        // TODO: Show search dialog
        print("Show Search")
    }

    private func createArchive() {
        // TODO: Create archive from selected files
        print("Create Archive")
    }

    private func extractArchive() {
        // TODO: Extract selected archive
        print("Extract Archive")
    }

    private func updateModifierKeys(_ notification: Notification) {
        // TODO: Update modifier keys based on current modifiers
        // This would need proper NSEvent handling
    }
}

struct FunctionKeyButton: View {
    let number: Int
    let label: String
    let action: () -> Void
    @State private var isPressed = false

    var body: some View {
        Button(action: action) {
            VStack(spacing: 1) {
                Text("F\(number)")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(.secondary)

                Text(label)
                    .font(.system(size: 11, weight: .regular))
                    .foregroundColor(.primary)
                    .lineLimit(1)
                    .truncationMode(.tail)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 3)
                    .fill(isPressed ? Color.blue.opacity(0.2) : Color.clear)
            )
        }
        .buttonStyle(PlainButtonStyle())
        .onLongPressGesture(minimumDuration: 0, maximumDistance: .infinity, pressing: { pressing in
            isPressed = pressing
        }, perform: {})
        .overlay(
            Rectangle()
                .frame(width: 1)
                .foregroundColor(Color(NSColor.separatorColor)),
            alignment: .trailing
        )
    }
}

extension Notification.Name {
    static let flagsChanged = Notification.Name("NSEventModifierFlagsChanged")
}
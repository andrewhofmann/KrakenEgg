import SwiftUI

struct KrakenEggToolbar: View {
    @ObservedObject var leftPanelState: PanelState
    @ObservedObject var rightPanelState: PanelState
    @Binding var activePanel: PanelSide
    @State private var showingSearchDialog = false
    @State private var showingSettingsDialog = false
    @State private var showingNewFolderDialog = false
    @State private var showingNewFileDialog = false

    var body: some View {
        HStack(spacing: 8) {
            // File Operations Group
            Group {
                ToolbarButton(
                    icon: "doc.on.doc",
                    title: "Copy",
                    action: copyFiles
                )

                ToolbarButton(
                    icon: "folder.badge.gearshape",
                    title: "Move",
                    action: moveFiles
                )

                ToolbarButton(
                    icon: "trash",
                    title: "Delete",
                    action: deleteFiles
                )

                ToolbarButton(
                    icon: "folder.badge.plus",
                    title: "New Folder",
                    action: { showingNewFolderDialog = true }
                )

                ToolbarButton(
                    icon: "doc.badge.plus",
                    title: "New File",
                    action: { showingNewFileDialog = true }
                )
            }

            Divider()

            // Archive Operations Group
            Group {
                ToolbarButton(
                    icon: "archivebox",
                    title: "Create Archive",
                    action: createArchive
                )

                ToolbarButton(
                    icon: "archivebox.fill",
                    title: "Extract",
                    action: extractArchive
                )
            }

            Divider()

            // Navigation and Search
            Group {
                ToolbarButton(
                    icon: "magnifyingglass",
                    title: "Search",
                    action: { showingSearchDialog = true }
                )

                ToolbarButton(
                    icon: "arrow.clockwise",
                    title: "Refresh",
                    action: refreshCurrentPanel
                )
            }

            Spacer()

            // Theme and Settings
            Group {
                ToolbarButton(
                    icon: "moon.fill",
                    title: "Toggle Theme",
                    action: toggleTheme
                )

                ToolbarButton(
                    icon: "gearshape.fill",
                    title: "Settings",
                    action: { showingSettingsDialog = true }
                )
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .frame(height: 44)
        .background(Color(NSColor.controlBackgroundColor))
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundColor(Color(NSColor.separatorColor)),
            alignment: .bottom
        )
        .sheet(isPresented: $showingSearchDialog) {
            SearchDialog()
        }
        .sheet(isPresented: $showingSettingsDialog) {
            SettingsDialog()
        }
        .sheet(isPresented: $showingNewFolderDialog) {
            NewFolderDialog(
                currentPath: (activePanel == .left ? leftPanelState : rightPanelState).currentPath,
                onCreateFolder: createNewFolder
            )
        }
        .sheet(isPresented: $showingNewFileDialog) {
            NewFileDialog(
                currentPath: (activePanel == .left ? leftPanelState : rightPanelState).currentPath,
                onCreateFile: createNewFile
            )
        }
    }

    // MARK: - Actions

    private func copyFiles() {
        let activeState = activePanel == .left ? leftPanelState : rightPanelState
        let targetState = activePanel == .left ? rightPanelState : leftPanelState

        guard activeState.selectedIndex < activeState.files.count else { return }
        let selectedFile = activeState.files[activeState.selectedIndex]

        // TODO: Implement actual copy operation
        print("Copy \(selectedFile.name) to \(targetState.currentPath)")
    }

    private func moveFiles() {
        let activeState = activePanel == .left ? leftPanelState : rightPanelState
        let targetState = activePanel == .left ? rightPanelState : leftPanelState

        guard activeState.selectedIndex < activeState.files.count else { return }
        let selectedFile = activeState.files[activeState.selectedIndex]

        // TODO: Implement actual move operation
        print("Move \(selectedFile.name) to \(targetState.currentPath)")
    }

    private func deleteFiles() {
        let activeState = activePanel == .left ? leftPanelState : rightPanelState

        guard activeState.selectedIndex < activeState.files.count else { return }
        let selectedFile = activeState.files[activeState.selectedIndex]

        // TODO: Show confirmation dialog and implement actual delete
        print("Delete \(selectedFile.name)")
    }

    private func createNewFolder(_ name: String) {
        let activeState = activePanel == .left ? leftPanelState : rightPanelState
        let folderPath = URL(fileURLWithPath: activeState.currentPath).appendingPathComponent(name)

        do {
            try FileManager.default.createDirectory(at: folderPath, withIntermediateDirectories: false, attributes: nil)
            // Refresh the current directory to show the new folder
            activeState.loadDirectory(activeState.currentPath)
        } catch {
            print("Error creating folder: \(error.localizedDescription)")
            // TODO: Show error dialog
        }
    }

    private func createNewFile(_ name: String) {
        let activeState = activePanel == .left ? leftPanelState : rightPanelState
        let filePath = URL(fileURLWithPath: activeState.currentPath).appendingPathComponent(name)

        do {
            // Create an empty file
            try Data().write(to: filePath)
            // Refresh the current directory to show the new file
            activeState.loadDirectory(activeState.currentPath)
        } catch {
            print("Error creating file: \(error.localizedDescription)")
            // TODO: Show error dialog
        }
    }

    private func createArchive() {
        let activeState = activePanel == .left ? leftPanelState : rightPanelState

        guard activeState.selectedIndex < activeState.files.count else { return }
        let selectedFile = activeState.files[activeState.selectedIndex]

        // TODO: Show archive creation dialog
        print("Create archive from \(selectedFile.name)")
    }

    private func extractArchive() {
        let activeState = activePanel == .left ? leftPanelState : rightPanelState

        guard activeState.selectedIndex < activeState.files.count else { return }
        let selectedFile = activeState.files[activeState.selectedIndex]

        if selectedFile.isArchive {
            // TODO: Show extraction dialog
            print("Extract \(selectedFile.name)")
        }
    }

    private func refreshCurrentPanel() {
        let activeState = activePanel == .left ? leftPanelState : rightPanelState
        activeState.loadDirectory(activeState.currentPath)
    }

    private func toggleTheme() {
        // TODO: Implement theme switching
        print("Toggle theme")
    }
}

struct ToolbarButton: View {
    let icon: String
    let title: String
    let action: () -> Void
    @State private var isHovered = false

    var body: some View {
        Button(action: action) {
            VStack(spacing: 2) {
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.primary)

                Text(title)
                    .font(.system(size: 10, weight: .regular))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
            .frame(width: 60, height: 32)
            .background(
                RoundedRectangle(cornerRadius: 6)
                    .fill(isHovered ? Color.blue.opacity(0.1) : Color.clear)
            )
        }
        .buttonStyle(PlainButtonStyle())
        .onHover { hovering in
            isHovered = hovering
        }
        .help(title)
    }
}

// Dialog implementations
struct SearchDialog: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var searchText = ""
    @State private var searchInSubfolders = true
    @State private var caseSensitive = false

    var body: some View {
        VStack(spacing: 16) {
            Text("Search Files and Folders")
                .font(.headline)
                .padding(.bottom, 8)

            VStack(alignment: .leading, spacing: 12) {
                Text("Search for:")
                    .font(.subheadline)
                TextField("Enter filename or pattern", text: $searchText)
                    .textFieldStyle(RoundedBorderTextFieldStyle())

                Toggle("Search in subfolders", isOn: $searchInSubfolders)
                Toggle("Case sensitive", isOn: $caseSensitive)
            }

            HStack {
                Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                }
                .keyboardShortcut(.cancelAction)

                Spacer()

                Button("Search") {
                    // TODO: Implement actual search functionality
                    print("Searching for: \(searchText)")
                    presentationMode.wrappedValue.dismiss()
                }
                .keyboardShortcut(.defaultAction)
                .disabled(searchText.isEmpty)
            }
        }
        .padding(20)
        .frame(width: 400, height: 250)
    }
}

struct SettingsDialog: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var showHiddenFiles = false
    @State private var doubleClickToNavigate = true
    @State private var autoRefresh = true

    var body: some View {
        VStack(spacing: 16) {
            Text("KrakenEgg Settings")
                .font(.headline)
                .padding(.bottom, 8)

            VStack(alignment: .leading, spacing: 12) {
                GroupBox("File Display") {
                    VStack(alignment: .leading, spacing: 8) {
                        Toggle("Show hidden files and folders", isOn: $showHiddenFiles)
                        Toggle("Auto-refresh directory contents", isOn: $autoRefresh)
                    }
                    .padding(8)
                }

                GroupBox("Navigation") {
                    VStack(alignment: .leading, spacing: 8) {
                        Toggle("Double-click to navigate into folders", isOn: $doubleClickToNavigate)
                    }
                    .padding(8)
                }
            }

            HStack {
                Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                }
                .keyboardShortcut(.cancelAction)

                Spacer()

                Button("Apply") {
                    // TODO: Save settings
                    print("Settings applied")
                    presentationMode.wrappedValue.dismiss()
                }
                .keyboardShortcut(.defaultAction)
            }
        }
        .padding(20)
        .frame(width: 450, height: 300)
    }
}

struct NewFolderDialog: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var folderName = "New Folder"
    let currentPath: String
    let onCreateFolder: (String) -> Void

    var body: some View {
        VStack(spacing: 16) {
            Text("Create New Folder")
                .font(.headline)

            Text("in \(currentPath)")
                .font(.caption)
                .foregroundColor(.secondary)

            TextField("Folder name", text: $folderName)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .onAppear {
                    // Select all text when dialog appears
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                        // This would need proper text field focus handling
                    }
                }

            HStack {
                Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                }
                .keyboardShortcut(.cancelAction)

                Spacer()

                Button("Create") {
                    onCreateFolder(folderName)
                    presentationMode.wrappedValue.dismiss()
                }
                .keyboardShortcut(.defaultAction)
                .disabled(folderName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
        .padding(20)
        .frame(width: 350, height: 150)
    }
}

struct NewFileDialog: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var fileName = "New File.txt"
    let currentPath: String
    let onCreateFile: (String) -> Void

    var body: some View {
        VStack(spacing: 16) {
            Text("Create New File")
                .font(.headline)

            Text("in \(currentPath)")
                .font(.caption)
                .foregroundColor(.secondary)

            TextField("File name", text: $fileName)
                .textFieldStyle(RoundedBorderTextFieldStyle())

            HStack {
                Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                }
                .keyboardShortcut(.cancelAction)

                Spacer()

                Button("Create") {
                    onCreateFile(fileName)
                    presentationMode.wrappedValue.dismiss()
                }
                .keyboardShortcut(.defaultAction)
                .disabled(fileName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
        .padding(20)
        .frame(width: 350, height: 150)
    }
}
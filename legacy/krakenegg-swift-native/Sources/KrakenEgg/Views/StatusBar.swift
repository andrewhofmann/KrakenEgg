import SwiftUI

struct StatusBar: View {
    @ObservedObject var leftPanelState: PanelState
    @ObservedObject var rightPanelState: PanelState
    @Binding var activePanel: PanelSide
    @State private var currentTime = Date()

    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        HStack(spacing: 16) {
            // Left Panel Stats
            PanelStats(
                panelState: leftPanelState,
                isActive: activePanel == .left,
                label: "Left"
            )

            Divider()

            // Right Panel Stats
            PanelStats(
                panelState: rightPanelState,
                isActive: activePanel == .right,
                label: "Right"
            )

            Spacer()

            // Global Stats
            Group {
                if let selectedStats = getSelectedStats() {
                    Text("\(selectedStats.count) selected (\(selectedStats.size))")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)

                    Divider()
                }

                // Current Time
                Text(formatTime(currentTime))
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundColor(.secondary)

                // Version
                Text("v1.0.0")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 4)
        .frame(height: 24)
        .background(Color(NSColor.controlBackgroundColor))
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundColor(Color(NSColor.separatorColor)),
            alignment: .top
        )
        .onReceive(timer) { time in
            currentTime = time
        }
    }

    private func getSelectedStats() -> (count: Int, size: String)? {
        let activeState = activePanel == .left ? leftPanelState : rightPanelState

        // TODO: Implement proper selection tracking
        // For now, just show if there's a selected file
        if !activeState.files.isEmpty && activeState.selectedIndex < activeState.files.count {
            let selectedFile = activeState.files[activeState.selectedIndex]
            if !selectedFile.isDirectory {
                return (1, selectedFile.displaySize)
            }
        }
        return nil
    }

    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        return formatter.string(from: date)
    }
}

struct PanelStats: View {
    @ObservedObject var panelState: PanelState
    let isActive: Bool
    let label: String

    var body: some View {
        HStack(spacing: 8) {
            // Panel indicator
            Circle()
                .fill(isActive ? Color.blue : Color.gray)
                .frame(width: 6, height: 6)

            // Stats
            Text(getStatsText())
                .font(.system(size: 11))
                .foregroundColor(.primary)
                .lineLimit(1)
        }
    }

    private func getStatsText() -> String {
        if panelState.isLoading {
            return "\(label): Loading..."
        }

        let totalFiles = panelState.files.count
        let directories = panelState.files.filter { $0.isDirectory && $0.name != ".." }.count
        let files = totalFiles - directories - (panelState.files.first?.name == ".." ? 1 : 0)

        let totalSize = panelState.files
            .filter { !$0.isDirectory && $0.name != ".." }
            .reduce(0) { $0 + $1.size }

        let sizeString = ByteCountFormatter.string(fromByteCount: totalSize, countStyle: .file)

        if directories > 0 && files > 0 {
            return "\(label): \(directories) dirs, \(files) files (\(sizeString))"
        } else if directories > 0 {
            return "\(label): \(directories) dirs"
        } else if files > 0 {
            return "\(label): \(files) files (\(sizeString))"
        } else {
            return "\(label): Empty"
        }
    }
}
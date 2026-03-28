import Foundation

class FileSystemService {
    static let shared = FileSystemService()

    private init() {}

    func listDirectory(at path: String) -> [FileItem] {
        let url = URL(fileURLWithPath: path)
        let fileManager = FileManager.default

        do {
            let contents = try fileManager.contentsOfDirectory(at: url, includingPropertiesForKeys: [
                .nameKey,
                .fileSizeKey,
                .isDirectoryKey,
                .isHiddenKey,
                .contentModificationDateKey,
                .creationDateKey,
                .fileResourceTypeKey
            ], options: [])

            var items: [FileItem] = []

            // Add parent directory entry if not at root
            if path != "/" {
                let parentPath = url.deletingLastPathComponent().path
                let parentItem = FileItem(
                    id: UUID().uuidString,
                    name: "..",
                    path: parentPath,
                    size: 0,
                    isDirectory: true,
                    isHidden: false,
                    modified: Date(),
                    created: Date(),
                    permissions: FilePermissions(isReadable: true, isWritable: false, isExecutable: true),
                    `extension`: nil,
                    mimeType: nil,
                    isArchive: false,
                    archivePath: nil
                )
                items.append(parentItem)
            }

            // Process directory contents
            for contentURL in contents {
                let resourceValues = try contentURL.resourceValues(forKeys: [
                    .nameKey,
                    .fileSizeKey,
                    .isDirectoryKey,
                    .isHiddenKey,
                    .contentModificationDateKey,
                    .creationDateKey,
                    .fileResourceTypeKey
                ])

                let name = resourceValues.name ?? contentURL.lastPathComponent
                let size = Int64(resourceValues.fileSize ?? 0)
                let isDirectory = resourceValues.isDirectory ?? false
                let isHidden = resourceValues.isHidden ?? false
                let modified = resourceValues.contentModificationDate ?? Date()
                let created = resourceValues.creationDate ?? Date()
                let pathExtension = contentURL.pathExtension.isEmpty ? nil : contentURL.pathExtension

                // Check if file is readable/writable
                let isReadable = fileManager.isReadableFile(atPath: contentURL.path)
                let isWritable = fileManager.isWritableFile(atPath: contentURL.path)
                let isExecutable = fileManager.isExecutableFile(atPath: contentURL.path)

                let permissions = FilePermissions(
                    isReadable: isReadable,
                    isWritable: isWritable,
                    isExecutable: isExecutable
                )

                // Determine if it's an archive
                let isArchive = isArchiveFile(pathExtension)

                // Determine MIME type
                let mimeType = getMimeType(for: pathExtension)

                let fileItem = FileItem(
                    id: UUID().uuidString,
                    name: name,
                    path: contentURL.path,
                    size: size,
                    isDirectory: isDirectory,
                    isHidden: isHidden,
                    modified: modified,
                    created: created,
                    permissions: permissions,
                    `extension`: pathExtension,
                    mimeType: mimeType,
                    isArchive: isArchive,
                    archivePath: nil
                )

                items.append(fileItem)
            }

            // Sort: directories first, then by name
            return items.sorted { first, second in
                // Keep ".." at the top
                if first.name == ".." { return true }
                if second.name == ".." { return false }

                // Then directories before files
                if first.isDirectory != second.isDirectory {
                    return first.isDirectory
                }

                // Then alphabetically
                return first.name.localizedCaseInsensitiveCompare(second.name) == .orderedAscending
            }

        } catch {
            print("Error listing directory: \(error)")
            return []
        }
    }

    private func isArchiveFile(_ pathExtension: String?) -> Bool {
        guard let ext = pathExtension?.lowercased() else { return false }
        let archiveExtensions = ["zip", "tar", "gz", "bz2", "7z", "rar", "dmg", "pkg"]
        return archiveExtensions.contains(ext)
    }

    private func getMimeType(for pathExtension: String?) -> String? {
        guard let ext = pathExtension?.lowercased() else { return nil }

        let mimeTypes: [String: String] = [
            "txt": "text/plain",
            "md": "text/markdown",
            "html": "text/html",
            "css": "text/css",
            "js": "application/javascript",
            "json": "application/json",
            "xml": "application/xml",
            "pdf": "application/pdf",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "gif": "image/gif",
            "svg": "image/svg+xml",
            "mp3": "audio/mpeg",
            "mp4": "video/mp4",
            "avi": "video/x-msvideo",
            "mov": "video/quicktime"
        ]

        return mimeTypes[ext]
    }

    func getHomeDirectory() -> String {
        return FileManager.default.homeDirectoryForCurrentUser.path
    }

    func getCurrentDirectory() -> String {
        return FileManager.default.currentDirectoryPath
    }
}
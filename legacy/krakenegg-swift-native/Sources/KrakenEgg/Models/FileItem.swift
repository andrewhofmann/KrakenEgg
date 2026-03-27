import Foundation

struct FileItem: Identifiable, Hashable, Codable {
    let id: String
    let name: String
    let path: String
    let size: Int64
    let isDirectory: Bool
    let isHidden: Bool
    let modified: Date
    let created: Date
    let permissions: FilePermissions
    let `extension`: String?
    let mimeType: String?
    let isArchive: Bool
    let archivePath: String?

    var displaySize: String {
        if isDirectory {
            return ""
        }
        return ByteCountFormatter.string(fromByteCount: size, countStyle: .file)
    }

    var icon: String {
        if name == ".." {
            return "arrow.up"
        }

        if isDirectory {
            return "folder.fill"
        }

        if isArchive {
            return "archivebox.fill"
        }

        guard let ext = self.`extension`?.lowercased() else {
            return "doc.fill"
        }

        switch ext {
        case "txt", "md", "readme":
            return "doc.text.fill"
        case "pdf":
            return "doc.text.fill"
        case "jpg", "jpeg", "png", "gif", "svg", "bmp", "tiff":
            return "photo.fill"
        case "mp3", "m4a", "wav", "aiff", "flac":
            return "music.note"
        case "mp4", "mov", "avi", "mkv", "m4v":
            return "film.fill"
        case "zip", "tar", "gz", "bz2", "7z", "rar":
            return "archivebox.fill"
        case "app":
            return "app.fill"
        case "dmg":
            return "opticaldiscdrive.fill"
        case "html", "htm":
            return "globe"
        case "js", "ts", "jsx", "tsx":
            return "curlybraces"
        case "css", "scss", "sass":
            return "paintbrush.fill"
        case "json", "xml", "yaml", "yml":
            return "doc.text.below.ecg.fill"
        case "swift", "py", "java", "cpp", "c", "h", "m", "mm":
            return "chevron.left.forwardslash.chevron.right"
        case "xcode", "xcodeproj", "xcworkspace":
            return "hammer.fill"
        default:
            return "doc.fill"
        }
    }

    var typeDescription: String {
        if name == ".." {
            return "Parent Directory"
        }

        if isDirectory {
            return "Folder"
        }

        guard let ext = self.`extension`?.lowercased() else {
            return "File"
        }

        switch ext {
        case "txt":
            return "Text Document"
        case "md":
            return "Markdown Document"
        case "pdf":
            return "PDF Document"
        case "jpg", "jpeg":
            return "JPEG Image"
        case "png":
            return "PNG Image"
        case "gif":
            return "GIF Image"
        case "svg":
            return "SVG Image"
        case "mp3":
            return "MP3 Audio"
        case "mp4":
            return "MP4 Video"
        case "mov":
            return "QuickTime Movie"
        case "zip":
            return "ZIP Archive"
        case "tar":
            return "TAR Archive"
        case "dmg":
            return "Disk Image"
        case "app":
            return "Application"
        case "swift":
            return "Swift Source"
        case "py":
            return "Python Script"
        case "js":
            return "JavaScript"
        case "html":
            return "HTML Document"
        case "css":
            return "CSS Stylesheet"
        default:
            return ext.uppercased() + " File"
        }
    }
}

struct FilePermissions: Hashable, Codable {
    let isReadable: Bool
    let isWritable: Bool
    let isExecutable: Bool

    var description: String {
        let r = isReadable ? "r" : "-"
        let w = isWritable ? "w" : "-"
        let x = isExecutable ? "x" : "-"
        return r + w + x
    }
}
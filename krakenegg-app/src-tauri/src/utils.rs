use std::path::Path;
use std::fs;
use walkdir::WalkDir;

pub fn delete_recursive(path: &Path) -> std::io::Result<()> {
    if !path.exists() { return Ok(()); }
    if path.is_dir() {
        fs::remove_dir_all(path)
    } else {
        fs::remove_file(path)
    }
}

pub fn copy_recursive(src: &Path, dest: &Path) -> std::io::Result<()> {
    if src.is_dir() {
        fs::create_dir_all(dest)?;
        for entry in WalkDir::new(src).min_depth(1) {
            let entry = entry?;
            let rel_path = entry.path().strip_prefix(src).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
            let target_path = dest.join(rel_path);
            if entry.file_type().is_dir() {
                fs::create_dir_all(&target_path)?;
            } else {
                fs::copy(entry.path(), &target_path)?;
            }
        }
    } else {
        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::copy(src, dest)?;
    }
    Ok(())
}

pub fn format_permissions(mode: u32) -> String {
    let perms = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"];
    format!("{}{}{}{}{}{}",
        if mode & 0o4000 != 0 { 's' } else { '-' }, // SUID
        if mode & 0o2000 != 0 { 's' } else { '-' }, // SGID
        if mode & 0o1000 != 0 { 't' } else { '-' }, // Sticky bit
        perms[((mode >> 6) & 0o7) as usize],
        perms[((mode >> 3) & 0o7) as usize],
        perms[((mode >> 0) & 0o7) as usize],
    )
}

pub fn format_size(size: u64) -> String {
    if size < 1024 {
        return format!("{} B", size);
    }
    let kb = size as f64 / 1024.0;
    if kb < 1024.0 {
        return format!("{:.1} KB", kb);
    }
    let mb = kb / 1024.0;
    if mb < 1024.0 {
        return format!("{:.1} MB", mb);
    }
    let gb = mb / 1024.0;
    format!("{:.1} GB", gb)
}

pub fn format_date(timestamp: u64) -> String {
    // This function requires chrono for proper date formatting.
    // For now, let's keep it simple or note the dependency.
    // std::time::SystemTime does not have direct to_string methods easily.
    // Placeholder logic for now, or use an external crate.
    format!("{}", timestamp) // Simply return timestamp as string for now
}

// Helper to check if a file is likely binary
pub fn is_binary(data: &[u8]) -> bool {
    // A simple heuristic: if it contains null bytes, it's likely binary.
    // We check the first 8KB.
    data.iter().take(8192).any(|&b| b == 0)
}

// Helper to determine if a file is a text file based on extension
// This helps to avoid reading and searching non-text files (images, archives, etc.)
pub fn is_text_file_by_extension(file_name: &Path) -> bool {
    if let Some(ext) = file_name.extension().and_then(|s| s.to_str()) {
        !matches!(
            ext.to_lowercase().as_str(),
            // Common binary/non-text extensions
            "png" | "jpg" | "jpeg" | "gif" | "bmp" | "tiff" | "ico" | "webp" |
            "zip" | "rar" | "7z" | "tar" | "gz" | "bz2" | "xz" | "tgz" |
            "mp3" | "wav" | "ogg" | "mp4" | "avi" | "mov" | "mkv" |
            "pdf" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx" |
            "exe" | "dll" | "so" | "dylib" | "bin" | "dat"
        )
    } else {
        true // Assume no extension means it could be a text file or generic file
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::fs;

    #[test]
    fn test_delete_recursive_removes_file() {
        let dir = TempDir::new().unwrap();
        let file_path = dir.path().join("test.txt");
        fs::write(&file_path, "hello").unwrap();
        assert!(file_path.exists());
        delete_recursive(&file_path).unwrap();
        assert!(!file_path.exists());
    }

    #[test]
    fn test_delete_recursive_removes_directory() {
        let dir = TempDir::new().unwrap();
        let sub = dir.path().join("subdir");
        fs::create_dir(&sub).unwrap();
        fs::write(sub.join("file.txt"), "data").unwrap();
        delete_recursive(&sub).unwrap();
        assert!(!sub.exists());
    }

    #[test]
    fn test_delete_recursive_nonexistent_path_ok() {
        let result = delete_recursive(Path::new("/tmp/nonexistent_krakenegg_test_path"));
        assert!(result.is_ok());
    }

    #[test]
    fn test_copy_recursive_copies_file() {
        let dir = TempDir::new().unwrap();
        let src = dir.path().join("source.txt");
        let dest = dir.path().join("dest.txt");
        fs::write(&src, "content").unwrap();
        copy_recursive(&src, &dest).unwrap();
        assert_eq!(fs::read_to_string(&dest).unwrap(), "content");
    }

    #[test]
    fn test_copy_recursive_copies_directory_tree() {
        let dir = TempDir::new().unwrap();
        let src = dir.path().join("src_dir");
        fs::create_dir_all(src.join("sub")).unwrap();
        fs::write(src.join("a.txt"), "a").unwrap();
        fs::write(src.join("sub/b.txt"), "b").unwrap();
        let dest = dir.path().join("dest_dir");
        copy_recursive(&src, &dest).unwrap();
        assert_eq!(fs::read_to_string(dest.join("a.txt")).unwrap(), "a");
        assert_eq!(fs::read_to_string(dest.join("sub/b.txt")).unwrap(), "b");
    }

    #[test]
    fn test_format_permissions() {
        assert_eq!(format_permissions(0o755), "---rwxr-xr-x");
        assert_eq!(format_permissions(0o644), "---rw-r--r--");
        assert_eq!(format_permissions(0o700), "---rwx------");
    }

    #[test]
    fn test_format_size() {
        assert_eq!(format_size(500), "500 B");
        assert_eq!(format_size(1024), "1.0 KB");
        assert_eq!(format_size(1048576), "1.0 MB");
        assert_eq!(format_size(1073741824), "1.0 GB");
    }

    #[test]
    fn test_is_binary_detects_null_bytes() {
        let data = b"hello\x00world";
        assert!(is_binary(data));
    }

    #[test]
    fn test_is_binary_returns_false_for_text() {
        let data = b"hello world\nthis is text";
        assert!(!is_binary(data));
    }

    #[test]
    fn test_is_text_file_by_extension_identifies_text() {
        assert!(is_text_file_by_extension(Path::new("file.rs")));
        assert!(is_text_file_by_extension(Path::new("file.txt")));
        assert!(is_text_file_by_extension(Path::new("file.json")));
    }

    #[test]
    fn test_is_text_file_by_extension_identifies_binary() {
        assert!(!is_text_file_by_extension(Path::new("image.png")));
        assert!(!is_text_file_by_extension(Path::new("archive.zip")));
        assert!(!is_text_file_by_extension(Path::new("video.mp4")));
    }

    #[test]
    fn test_is_text_file_no_extension() {
        assert!(is_text_file_by_extension(Path::new("Makefile")));
    }

    // --- copy_recursive additional tests ---

    #[test]
    fn test_copy_recursive_creates_parent_dirs() {
        let dir = TempDir::new().unwrap();
        let src = dir.path().join("source.txt");
        fs::write(&src, "parent test").unwrap();
        let dest = dir.path().join("a/b/c/dest.txt");
        copy_recursive(&src, &dest).unwrap();
        assert_eq!(fs::read_to_string(&dest).unwrap(), "parent test");
    }

    #[test]
    fn test_copy_recursive_overwrites_existing_file() {
        let dir = TempDir::new().unwrap();
        let src = dir.path().join("src.txt");
        let dest = dir.path().join("dest.txt");
        fs::write(&src, "new content").unwrap();
        fs::write(&dest, "old content").unwrap();
        copy_recursive(&src, &dest).unwrap();
        assert_eq!(fs::read_to_string(&dest).unwrap(), "new content");
    }

    #[test]
    fn test_copy_recursive_empty_directory() {
        let dir = TempDir::new().unwrap();
        let src = dir.path().join("empty_dir");
        fs::create_dir(&src).unwrap();
        let dest = dir.path().join("copied_empty");
        copy_recursive(&src, &dest).unwrap();
        assert!(dest.exists());
        assert!(dest.is_dir());
        assert_eq!(fs::read_dir(&dest).unwrap().count(), 0);
    }

    // --- delete_recursive additional tests ---

    #[test]
    fn test_delete_recursive_deeply_nested() {
        let dir = TempDir::new().unwrap();
        let deep = dir.path().join("a/b/c");
        fs::create_dir_all(&deep).unwrap();
        fs::write(deep.join("file.txt"), "deep").unwrap();
        delete_recursive(&dir.path().join("a")).unwrap();
        assert!(!dir.path().join("a").exists());
    }

    #[test]
    fn test_delete_recursive_with_many_files() {
        let dir = TempDir::new().unwrap();
        let sub = dir.path().join("many");
        fs::create_dir(&sub).unwrap();
        for i in 0..50 {
            fs::write(sub.join(format!("file_{}.txt", i)), format!("content {}", i)).unwrap();
        }
        assert_eq!(fs::read_dir(&sub).unwrap().count(), 50);
        delete_recursive(&sub).unwrap();
        assert!(!sub.exists());
    }

    // --- format_permissions additional tests ---

    #[test]
    fn test_format_permissions_000() {
        assert_eq!(format_permissions(0o000), "------------");
    }

    #[test]
    fn test_format_permissions_777() {
        assert_eq!(format_permissions(0o777), "---rwxrwxrwx");
    }

    #[test]
    fn test_format_permissions_suid() {
        let result = format_permissions(0o4755);
        assert!(result.starts_with("s--"));
        assert_eq!(result, "s--rwxr-xr-x");
    }

    #[test]
    fn test_format_permissions_sgid() {
        let result = format_permissions(0o2755);
        assert_eq!(result, "-s-rwxr-xr-x");
    }

    #[test]
    fn test_format_permissions_sticky() {
        let result = format_permissions(0o1755);
        assert_eq!(result, "--trwxr-xr-x");
    }

    // --- format_size additional tests ---

    #[test]
    fn test_format_size_zero() {
        assert_eq!(format_size(0), "0 B");
    }

    #[test]
    fn test_format_size_exactly_1kb() {
        assert_eq!(format_size(1024), "1.0 KB");
    }

    #[test]
    fn test_format_size_exactly_1mb() {
        assert_eq!(format_size(1024 * 1024), "1.0 MB");
    }

    #[test]
    fn test_format_size_exactly_1gb() {
        assert_eq!(format_size(1024 * 1024 * 1024), "1.0 GB");
    }

    #[test]
    fn test_format_size_large_tb() {
        // 1 TB = 1024 GB, should show as 1024.0 GB
        assert_eq!(format_size(1024u64 * 1024 * 1024 * 1024), "1024.0 GB");
    }

    #[test]
    fn test_format_size_boundary_1023() {
        assert_eq!(format_size(1023), "1023 B");
    }

    #[test]
    fn test_format_size_boundary_1024() {
        assert_eq!(format_size(1024), "1.0 KB");
    }

    // --- is_binary additional tests ---

    #[test]
    fn test_is_binary_empty_data() {
        let data: &[u8] = b"";
        assert!(!is_binary(data));
    }

    #[test]
    fn test_is_binary_all_text() {
        let data = b"The quick brown fox jumps over the lazy dog.\n1234567890";
        assert!(!is_binary(data));
    }

    #[test]
    fn test_is_binary_null_at_start() {
        let data = b"\x00hello world";
        assert!(is_binary(data));
    }

    #[test]
    fn test_is_binary_null_at_end() {
        let data = b"hello world\x00";
        assert!(is_binary(data));
    }

    #[test]
    fn test_is_binary_large_text() {
        // 8KB+ of pure text should not be binary
        let data: Vec<u8> = "abcdefghij\n".repeat(1000).into_bytes();
        assert!(data.len() > 8192);
        assert!(!is_binary(&data));
    }

    // --- is_text_file_by_extension additional tests ---

    #[test]
    fn test_is_text_file_by_extension_all_binary_types() {
        let binary_exts = [
            "png", "jpg", "jpeg", "gif", "bmp", "tiff", "ico", "webp",
            "zip", "rar", "7z", "tar", "gz", "bz2", "xz", "tgz",
            "mp3", "wav", "ogg", "mp4", "avi", "mov", "mkv",
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
            "exe", "dll", "so", "dylib", "bin", "dat",
        ];
        for ext in &binary_exts {
            let filename = format!("file.{}", ext);
            let path = Path::new(&filename);
            assert!(!is_text_file_by_extension(path), "Expected {} to be binary", ext);
        }
    }

    #[test]
    fn test_is_text_file_by_extension_all_text_types() {
        let text_exts = [
            "rs", "txt", "json", "toml", "yaml", "yml", "xml", "html",
            "css", "js", "ts", "tsx", "jsx", "md", "py", "rb", "go",
            "java", "c", "cpp", "h", "hpp", "sh", "bat", "conf", "ini",
            "sql", "csv",
        ];
        for ext in &text_exts {
            let filename = format!("file.{}", ext);
            let path = Path::new(&filename);
            assert!(is_text_file_by_extension(path), "Expected {} to be text", ext);
        }
    }

    #[test]
    fn test_is_text_file_by_extension_case_insensitive() {
        assert!(!is_text_file_by_extension(Path::new("image.PNG")));
        assert!(!is_text_file_by_extension(Path::new("archive.ZIP")));
        assert!(!is_text_file_by_extension(Path::new("video.MP4")));
        assert!(!is_text_file_by_extension(Path::new("document.PDF")));
    }
}
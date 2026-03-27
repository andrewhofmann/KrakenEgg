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
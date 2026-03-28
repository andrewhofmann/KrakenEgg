use std::fs;
use std::path::{Path, PathBuf};
use std::io::{self, Read};
use flate2::read::GzDecoder;
use crate::models::FileInfo;
use walkdir::WalkDir;

/// Guard that deletes a temp file on drop (cleanup on error paths)
struct TempFileGuard {
    path: PathBuf,
    disarmed: bool,
}
impl TempFileGuard {
    fn new(path: PathBuf) -> Self { Self { path, disarmed: false } }
    fn disarm(&mut self) { self.disarmed = true; }
}
impl Drop for TempFileGuard {
    fn drop(&mut self) { if !self.disarmed { let _ = fs::remove_file(&self.path); } }
}

pub fn parse_archive_path(full_path: &str) -> Option<(PathBuf, PathBuf)> {
    // Check longer extensions first to match .tar.gz before .tar
    let archive_exts = [".tar.gz", ".tgz", ".tar", ".zip"];
    for ext in archive_exts.iter() {
        if let Some(pos) = full_path.find(ext) {
            let archive_file_end = pos + ext.len();
            let after = &full_path[archive_file_end..];
            if after.is_empty() || after.starts_with('/') {
                let archive_file_candidate = PathBuf::from(&full_path[..archive_file_end]);
                if archive_file_candidate.exists() && archive_file_candidate.is_file() {
                    let internal_path = PathBuf::from(after.trim_start_matches('/'));
                    return Some((archive_file_candidate, internal_path));
                }
            }
        }
    }
    None
}

pub fn read_archive_file(archive_file_path: &Path, internal_path: &Path) -> Result<String, String> {
    let archive_file_name = archive_file_path.file_name().and_then(|s| s.to_str()).unwrap_or("");
    let internal_path_str = internal_path.to_string_lossy().replace('\\', "/");

    if archive_file_name.ends_with(".zip") {
        let file = fs::File::open(archive_file_path).map_err(|e| e.to_string())?;
        let mut zip = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
        let mut entry = zip.by_name(&internal_path_str).map_err(|e| format!("Entry not found: {}", e))?;
        let mut buffer = Vec::new();
        entry.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
        String::from_utf8(buffer).map_err(|e| format!("Encoding error: {}", e))
    } else if archive_file_name.ends_with(".tar") || archive_file_name.ends_with(".tar.gz") || archive_file_name.ends_with(".tgz") {
        let file = fs::File::open(archive_file_path).map_err(|e| e.to_string())?;
        let decoder: Box<dyn io::Read> = if archive_file_name.ends_with(".gz") || archive_file_name.ends_with(".tgz") {
            Box::new(GzDecoder::new(file))
        } else {
            Box::new(file)
        };
        let mut ar = tar::Archive::new(decoder);
        for entry_res in ar.entries().map_err(|e| e.to_string())? {
            let mut entry = entry_res.map_err(|e| e.to_string())?;
            let entry_path = entry.path().map_err(|e| e.to_string())?;
            if entry_path.to_str().unwrap_or("").replace('\\', "/") == internal_path_str {
                let mut buffer = Vec::new();
                entry.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
                return String::from_utf8(buffer).map_err(|e| format!("Encoding error: {}", e));
            }
        }
        Err("Entry not found".to_string())
    } else {
        Err(format!("Unsupported format: {}", archive_file_name))
    }
}

pub fn list_archive_contents(archive_file_path: &Path, internal_path: &Path) -> Result<Vec<FileInfo>, String> {
    let mut files: Vec<FileInfo> = Vec::new();
    let archive_file_name = archive_file_path.file_name().and_then(|s| s.to_str()).unwrap_or("");

    if archive_file_name.ends_with(".zip") {
        let file = fs::File::open(archive_file_path).map_err(|e| e.to_string())?;
        let mut zip = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

        let prefix_str = internal_path.to_string_lossy().replace('\\', "/");
        let prefix = if prefix_str.is_empty() { "".to_string() } else { format!("{}/", prefix_str.trim_end_matches('/')) };

        for i in 0..zip.len() {
            let file = zip.by_index(i).map_err(|e| e.to_string())?;
            let name = file.name().replace('\\', "/");
            if name.starts_with(&prefix) && name != prefix {
                let relative = &name[prefix.len()..];
                let child = relative.split('/').next().unwrap_or("");
                if !child.is_empty() && !files.iter().any(|f| f.name == child) {
                    let is_dir = file.is_dir() || relative.trim_end_matches('/').contains('/');
                    files.push(FileInfo { name: child.to_string(), is_dir, size: file.size(), modified_at: None, created_at: None, permissions: None, extension: if !is_dir { Path::new(child).extension().and_then(|e| e.to_str()).map(|e| e.to_lowercase()) } else { None }, is_symlink: false });
                }
            }
        }
    } else if archive_file_name.ends_with(".tar") || archive_file_name.ends_with(".tar.gz") || archive_file_name.ends_with(".tgz") {
        let file = fs::File::open(archive_file_path).map_err(|e| e.to_string())?;
        let decoder: Box<dyn io::Read> = if archive_file_name.ends_with(".gz") || archive_file_name.ends_with(".tgz") { Box::new(GzDecoder::new(file)) } else { Box::new(file) };
        let mut ar = tar::Archive::new(decoder);
        
        let prefix_str = internal_path.to_string_lossy().replace('\\', "/");
        let prefix = if prefix_str.is_empty() { "".to_string() } else { format!("{}/", prefix_str.trim_end_matches('/')) };

        for entry in ar.entries().map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path().map_err(|e| e.to_string())?;
            let name = path.to_str().unwrap_or("").replace('\\', "/");
            if name.starts_with(&prefix) && name != prefix {
                let relative = &name[prefix.len()..];
                let child = relative.split('/').next().unwrap_or("");
                if !child.is_empty() && !files.iter().any(|f| f.name == child) {
                    let is_dir = entry.header().entry_type().is_dir() || relative.trim_end_matches('/').contains('/');
                    files.push(FileInfo { name: child.to_string(), is_dir, size: entry.size(), modified_at: None, created_at: None, permissions: None, extension: if !is_dir { Path::new(child).extension().and_then(|e| e.to_str()).map(|e| e.to_lowercase()) } else { None }, is_symlink: false });
                }
            }
        }
    }
    
    files.sort_by(|a, b| if a.is_dir == b.is_dir { a.name.to_lowercase().cmp(&b.name.to_lowercase()) } else { b.is_dir.cmp(&a.is_dir) });
    Ok(files)
}

// Updated with conflict callback
pub fn extract_entry<F, C>(
    archive_path: &Path, 
    internal_path: &Path, 
    dest_path: &Path, 
    mut progress_cb: F,
    mut conflict_cb: C
) -> Result<(), String> 
where 
    F: FnMut(&str),
    C: FnMut(&Path) -> Result<bool, String> // Returns true to overwrite, false to skip/abort
{
    let archive_name = archive_path.file_name().and_then(|s| s.to_str()).unwrap_or("");
    let target_prefix = internal_path.to_string_lossy().replace('\\', "/");
    
    if archive_name.ends_with(".zip") {
        let file = fs::File::open(archive_path).map_err(|e| e.to_string())?;
        let mut zip = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
        
        for i in 0..zip.len() {
            let mut file = zip.by_index(i).map_err(|e| e.to_string())?;
            let name = file.name().replace('\\', "/");
            
            if name == target_prefix || (target_prefix.len() > 0 && name.starts_with(&format!("{}/", target_prefix))) {
                let rel_clean = name.trim_start_matches(&target_prefix).trim_start_matches('/');
                // Guard against path traversal (zip slip)
                if rel_clean.contains("..") {
                    continue;
                }
                let out_path = if rel_clean.is_empty() {
                    dest_path.to_path_buf()
                } else {
                    dest_path.join(rel_clean)
                };
                // Verify output path stays within dest_path
                if !out_path.starts_with(dest_path) {
                    continue;
                }

                if file.is_dir() {
                    fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
                } else {
                    if out_path.exists() {
                        if !conflict_cb(&out_path)? {
                            continue; // Skip
                        }
                    }

                    if let Some(parent) = out_path.parent() {
                        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
                    }
                    let mut outfile = fs::File::create(&out_path).map_err(|e| e.to_string())?;
                    io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
                    progress_cb(&name);
                }
            }
        }
    } else if archive_name.ends_with(".tar") || archive_name.ends_with(".tar.gz") || archive_name.ends_with(".tgz") {
        let file = fs::File::open(archive_path).map_err(|e| e.to_string())?;
        let decoder: Box<dyn io::Read> = if archive_name.ends_with(".gz") || archive_name.ends_with(".tgz") { Box::new(GzDecoder::new(file)) } else { Box::new(file) };
        let mut ar = tar::Archive::new(decoder);
        
        for entry in ar.entries().map_err(|e| e.to_string())? {
            let mut entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path().map_err(|e| e.to_string())?;
            let name = path.to_str().unwrap_or("").replace('\\', "/");
            
            // Skip symlinks to prevent symlink traversal attacks
            if entry.header().entry_type().is_symlink() || entry.header().entry_type().is_hard_link() {
                continue;
            }

            if name == target_prefix || (target_prefix.len() > 0 && name.starts_with(&format!("{}/", target_prefix))) {
                let rel_clean = name.trim_start_matches(&target_prefix).trim_start_matches('/');
                // Guard against path traversal (zip slip)
                if rel_clean.contains("..") {
                    continue;
                }
                let out_path = if rel_clean.is_empty() {
                    dest_path.to_path_buf()
                } else {
                    dest_path.join(rel_clean)
                };
                // Verify output path stays within dest_path
                if !out_path.starts_with(dest_path) {
                    continue;
                }

                if entry.header().entry_type().is_dir() {
                    fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
                } else {
                    if out_path.exists() {
                        if !conflict_cb(&out_path)? {
                            continue;
                        }
                    }

                    if let Some(parent) = out_path.parent() {
                        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
                    }
                    entry.unpack(&out_path).map_err(|e| e.to_string())?;
                    progress_cb(&name);
                }
            }
        }
    }
    Ok(())
}

pub fn add_files_to_zip(archive_path: &Path, sources: &[String], dest_dir_internal: &str) -> Result<(), String> {
    if !archive_path.to_string_lossy().ends_with(".zip") {
        return Err("Adding files only supported for ZIP archives currently".to_string());
    }

    let tmp_path = archive_path.with_extension("tmp");
    let mut guard = TempFileGuard::new(tmp_path.clone());

    let file = fs::File::open(archive_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

    let tmp_file = fs::File::create(&tmp_path).map_err(|e| e.to_string())?;
    let mut zip_w = zip::ZipWriter::new(tmp_file);
    let options = zip::write::SimpleFileOptions::default();

    for i in 0..zip.len() {
        let entry = zip.by_index(i).map_err(|e| e.to_string())?;
        zip_w.raw_copy_file(entry).map_err(|e| e.to_string())?;
    }

    for src in sources {
        let src_path = Path::new(src);
        let src_name = src_path.file_name().unwrap_or_default().to_string_lossy();

        if src_path.is_dir() {
            for entry in WalkDir::new(src_path) {
                let entry = entry.map_err(|e| e.to_string())?;
                let path = entry.path();
                if path.is_file() {
                    let rel = path.strip_prefix(src_path.parent().unwrap_or(src_path)).unwrap_or(path);
                    let internal_path = if dest_dir_internal.is_empty() {
                        rel.to_string_lossy().replace('\\', "/")
                    } else {
                        format!("{}/", dest_dir_internal.trim_end_matches('/')) + &rel.to_string_lossy().replace('\\', "/")
                    };

                    zip_w.start_file(internal_path, options).map_err(|e| e.to_string())?;
                    let mut f = fs::File::open(path).map_err(|e| e.to_string())?;
                    io::copy(&mut f, &mut zip_w).map_err(|e| e.to_string())?;
                }
            }
        } else {
            let internal_path = if dest_dir_internal.is_empty() {
                src_name.to_string()
            } else {
                format!("{}/", dest_dir_internal.trim_end_matches('/')) + &src_name
            };
            zip_w.start_file(internal_path, options).map_err(|e| e.to_string())?;
            let mut f = fs::File::open(src_path).map_err(|e| e.to_string())?;
            io::copy(&mut f, &mut zip_w).map_err(|e| e.to_string())?;
        }
    }

    zip_w.finish().map_err(|e| e.to_string())?;
    // Temp file is complete — rename atomically, then disarm the cleanup guard
    fs::rename(&tmp_path, archive_path).map_err(|e| e.to_string())?;
    guard.disarm();
    Ok(())
}

pub fn remove_files_from_zip(archive_path: &Path, internal_paths: &[String]) -> Result<(), String> {

    if !archive_path.to_string_lossy().ends_with(".zip") {
        return Err("Deleting files only supported for ZIP archives currently".to_string());
    }

    let tmp_path = archive_path.with_extension("tmp");
    let mut guard = TempFileGuard::new(tmp_path.clone());

    let file = fs::File::open(archive_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

    let tmp_file = fs::File::create(&tmp_path).map_err(|e| e.to_string())?;
    let mut zip_w = zip::ZipWriter::new(tmp_file);

    for i in 0..zip.len() {
        let entry = zip.by_index(i).map_err(|e| e.to_string())?;
        let name = entry.name().to_string();

        let should_delete = internal_paths.iter().any(|target| {
            name == *target || name.starts_with(&format!("{}/", target))
        });

        if !should_delete {
            zip_w.raw_copy_file(entry).map_err(|e| e.to_string())?;
        }
    }

    zip_w.finish().map_err(|e| e.to_string())?;
    fs::rename(&tmp_path, archive_path).map_err(|e| e.to_string())?;
    guard.disarm();
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::io::Write as IoWrite;

    fn create_test_zip(dir: &Path, name: &str, entries: &[(&str, &[u8])]) -> PathBuf {
        let zip_path = dir.join(name);
        let file = fs::File::create(&zip_path).unwrap();
        let mut zip = zip::ZipWriter::new(file);
        let options = zip::write::SimpleFileOptions::default();
        for (entry_name, content) in entries {
            zip.start_file(*entry_name, options).unwrap();
            zip.write_all(content).unwrap();
        }
        zip.finish().unwrap();
        zip_path
    }

    #[test]
    fn test_parse_archive_path_zip() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "test.zip", &[("hello.txt", b"hi")]);
        let full = format!("{}/hello.txt", zip_path.to_string_lossy());
        let result = parse_archive_path(&full);
        assert!(result.is_some());
        let (archive, internal) = result.unwrap();
        assert_eq!(archive, zip_path);
        assert_eq!(internal, PathBuf::from("hello.txt"));
    }

    #[test]
    fn test_parse_archive_path_returns_none_for_non_archive() {
        let result = parse_archive_path("/home/user/documents/file.txt");
        assert!(result.is_none());
    }

    #[test]
    fn test_list_archive_contents_zip() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "test.zip", &[
            ("file1.txt", b"content1"),
            ("file2.txt", b"content2"),
        ]);
        let result = list_archive_contents(&zip_path, &PathBuf::new()).unwrap();
        assert_eq!(result.len(), 2);
        let names: Vec<&str> = result.iter().map(|f| f.name.as_str()).collect();
        assert!(names.contains(&"file1.txt"));
        assert!(names.contains(&"file2.txt"));
    }

    #[test]
    fn test_list_archive_contents_zip_with_dirs() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "test.zip", &[
            ("subdir/file.txt", b"content"),
        ]);
        let result = list_archive_contents(&zip_path, &PathBuf::new()).unwrap();
        assert!(result.iter().any(|f| f.name == "subdir" && f.is_dir));
    }

    #[test]
    fn test_add_files_to_zip() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "test.zip", &[("existing.txt", b"data")]);
        let new_file = dir.path().join("new.txt");
        fs::write(&new_file, "new content").unwrap();
        add_files_to_zip(&zip_path, &[new_file.to_string_lossy().to_string()], "").unwrap();
        let contents = list_archive_contents(&zip_path, &PathBuf::new()).unwrap();
        assert_eq!(contents.len(), 2);
        let names: Vec<&str> = contents.iter().map(|f| f.name.as_str()).collect();
        assert!(names.contains(&"new.txt"));
    }

    #[test]
    fn test_remove_files_from_zip() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "test.zip", &[
            ("keep.txt", b"keep"),
            ("remove.txt", b"remove"),
        ]);
        remove_files_from_zip(&zip_path, &["remove.txt".to_string()]).unwrap();
        let contents = list_archive_contents(&zip_path, &PathBuf::new()).unwrap();
        assert_eq!(contents.len(), 1);
        assert_eq!(contents[0].name, "keep.txt");
    }

    #[test]
    fn test_read_archive_file_zip() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "test.zip", &[("hello.txt", b"hello world")]);
        let result = read_archive_file(&zip_path, &PathBuf::from("hello.txt")).unwrap();
        assert_eq!(result, "hello world");
    }

    // --- Helper to create a tar.gz file ---
    fn create_test_tar_gz(dir: &Path, name: &str, entries: &[(&str, &[u8])]) -> PathBuf {
        use flate2::write::GzEncoder;
        use flate2::Compression;
        let tar_gz_path = dir.join(name);
        let file = fs::File::create(&tar_gz_path).unwrap();
        let enc = GzEncoder::new(file, Compression::default());
        let mut ar = tar::Builder::new(enc);
        for (entry_name, content) in entries {
            let mut header = tar::Header::new_gnu();
            header.set_size(content.len() as u64);
            header.set_mode(0o644);
            header.set_cksum();
            ar.append_data(&mut header, *entry_name, &content[..]).unwrap();
        }
        ar.finish().unwrap();
        tar_gz_path
    }

    fn create_test_tar(dir: &Path, name: &str, entries: &[(&str, &[u8])]) -> PathBuf {
        let tar_path = dir.join(name);
        let file = fs::File::create(&tar_path).unwrap();
        let mut ar = tar::Builder::new(file);
        for (entry_name, content) in entries {
            let mut header = tar::Header::new_gnu();
            header.set_size(content.len() as u64);
            header.set_mode(0o644);
            header.set_cksum();
            ar.append_data(&mut header, *entry_name, &content[..]).unwrap();
        }
        ar.finish().unwrap();
        tar_path
    }

    #[test]
    fn test_parse_archive_path_tar_gz() {
        let dir = TempDir::new().unwrap();
        let tar_gz_path = create_test_tar_gz(dir.path(), "archive.tar.gz", &[("file.txt", b"data")]);
        let full = format!("{}/file.txt", tar_gz_path.to_string_lossy());
        let result = parse_archive_path(&full);
        assert!(result.is_some());
        let (archive, internal) = result.unwrap();
        assert_eq!(archive, tar_gz_path);
        assert_eq!(internal, PathBuf::from("file.txt"));
    }

    #[test]
    fn test_parse_archive_path_tgz() {
        let dir = TempDir::new().unwrap();
        let tgz_path = create_test_tar_gz(dir.path(), "archive.tgz", &[("readme.md", b"# Hi")]);
        let full = format!("{}/readme.md", tgz_path.to_string_lossy());
        let result = parse_archive_path(&full);
        assert!(result.is_some());
        let (archive, internal) = result.unwrap();
        assert_eq!(archive, tgz_path);
        assert_eq!(internal, PathBuf::from("readme.md"));
    }

    #[test]
    fn test_parse_archive_path_plain_tar() {
        let dir = TempDir::new().unwrap();
        let tar_path = create_test_tar(dir.path(), "archive.tar", &[("data.bin", b"\x00\x01")]);
        let full = format!("{}/data.bin", tar_path.to_string_lossy());
        let result = parse_archive_path(&full);
        assert!(result.is_some());
        let (archive, internal) = result.unwrap();
        assert_eq!(archive, tar_path);
        assert_eq!(internal, PathBuf::from("data.bin"));
    }

    #[test]
    fn test_parse_archive_path_nested_path() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "test.zip", &[("subdir/deep/file.txt", b"nested")]);
        let full = format!("{}/subdir/deep/file.txt", zip_path.to_string_lossy());
        let result = parse_archive_path(&full);
        assert!(result.is_some());
        let (archive, internal) = result.unwrap();
        assert_eq!(archive, zip_path);
        assert_eq!(internal, PathBuf::from("subdir/deep/file.txt"));
    }

    #[test]
    fn test_parse_archive_path_no_internal_path() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "test.zip", &[("a.txt", b"x")]);
        let full = zip_path.to_string_lossy().to_string();
        let result = parse_archive_path(&full);
        assert!(result.is_some());
        let (archive, internal) = result.unwrap();
        assert_eq!(archive, zip_path);
        assert_eq!(internal, PathBuf::from(""));
    }

    #[test]
    fn test_list_archive_empty_zip() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "empty.zip", &[]);
        let result = list_archive_contents(&zip_path, &PathBuf::new()).unwrap();
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn test_list_archive_nested_folders_zip() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "nested.zip", &[
            ("a/b/c.txt", b"deep"),
            ("a/b/d.txt", b"deep2"),
            ("a/top.txt", b"top"),
        ]);
        // List root: should see "a" dir
        let root = list_archive_contents(&zip_path, &PathBuf::new()).unwrap();
        assert_eq!(root.len(), 1);
        assert_eq!(root[0].name, "a");
        assert!(root[0].is_dir);

        // List "a": should see "b" dir and "top.txt"
        let a_contents = list_archive_contents(&zip_path, &PathBuf::from("a")).unwrap();
        assert_eq!(a_contents.len(), 2);
        let names: Vec<&str> = a_contents.iter().map(|f| f.name.as_str()).collect();
        assert!(names.contains(&"b"));
        assert!(names.contains(&"top.txt"));
    }

    #[test]
    fn test_read_archive_nonexistent_entry() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "test.zip", &[("a.txt", b"data")]);
        let result = read_archive_file(&zip_path, &PathBuf::from("nonexistent.txt"));
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Entry not found"));
    }

    #[test]
    fn test_add_files_to_zip_directory() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "test.zip", &[("existing.txt", b"old")]);

        // Create a directory with files
        let sub = dir.path().join("mydir");
        fs::create_dir_all(sub.join("inner")).unwrap();
        fs::write(sub.join("one.txt"), "one").unwrap();
        fs::write(sub.join("inner").join("two.txt"), "two").unwrap();

        add_files_to_zip(&zip_path, &[sub.to_string_lossy().to_string()], "").unwrap();

        let contents = list_archive_contents(&zip_path, &PathBuf::new()).unwrap();
        let names: Vec<&str> = contents.iter().map(|f| f.name.as_str()).collect();
        assert!(names.contains(&"existing.txt"));
        assert!(names.contains(&"mydir"));
    }

    #[test]
    fn test_add_files_to_zip_multiple_files() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "test.zip", &[]);

        let f1 = dir.path().join("alpha.txt");
        let f2 = dir.path().join("beta.txt");
        let f3 = dir.path().join("gamma.txt");
        fs::write(&f1, "a").unwrap();
        fs::write(&f2, "b").unwrap();
        fs::write(&f3, "c").unwrap();

        add_files_to_zip(&zip_path, &[
            f1.to_string_lossy().to_string(),
            f2.to_string_lossy().to_string(),
            f3.to_string_lossy().to_string(),
        ], "").unwrap();

        let contents = list_archive_contents(&zip_path, &PathBuf::new()).unwrap();
        assert_eq!(contents.len(), 3);
    }

    #[test]
    fn test_remove_files_preserves_other_entries() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "test.zip", &[
            ("a.txt", b"a"),
            ("b.txt", b"b"),
            ("c.txt", b"c"),
        ]);
        remove_files_from_zip(&zip_path, &["b.txt".to_string()]).unwrap();
        let contents = list_archive_contents(&zip_path, &PathBuf::new()).unwrap();
        assert_eq!(contents.len(), 2);
        let names: Vec<&str> = contents.iter().map(|f| f.name.as_str()).collect();
        assert!(names.contains(&"a.txt"));
        assert!(names.contains(&"c.txt"));
        assert!(!names.contains(&"b.txt"));
    }

    #[test]
    fn test_remove_nonexistent_file_from_zip() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "test.zip", &[
            ("a.txt", b"a"),
            ("b.txt", b"b"),
        ]);
        // Removing a nonexistent entry should succeed (no-op)
        remove_files_from_zip(&zip_path, &["no_such_file.txt".to_string()]).unwrap();
        let contents = list_archive_contents(&zip_path, &PathBuf::new()).unwrap();
        assert_eq!(contents.len(), 2);
    }

    #[test]
    fn test_add_files_non_zip_error() {
        let dir = TempDir::new().unwrap();
        let tar_path = create_test_tar(dir.path(), "archive.tar", &[("x.txt", b"x")]);
        let dummy = dir.path().join("new.txt");
        fs::write(&dummy, "data").unwrap();
        let result = add_files_to_zip(&tar_path, &[dummy.to_string_lossy().to_string()], "");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("ZIP"));
    }

    #[test]
    fn test_remove_files_non_zip_error() {
        let dir = TempDir::new().unwrap();
        let tar_path = create_test_tar(dir.path(), "archive.tar", &[("x.txt", b"x")]);
        let result = remove_files_from_zip(&tar_path, &["x.txt".to_string()]);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("ZIP"));
    }

    #[test]
    fn test_list_archive_with_subdirectory_filter() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "test.zip", &[
            ("docs/readme.md", b"readme"),
            ("docs/guide.md", b"guide"),
            ("src/main.rs", b"fn main(){}"),
        ]);
        let result = list_archive_contents(&zip_path, &PathBuf::from("docs")).unwrap();
        assert_eq!(result.len(), 2);
        let names: Vec<&str> = result.iter().map(|f| f.name.as_str()).collect();
        assert!(names.contains(&"readme.md"));
        assert!(names.contains(&"guide.md"));
    }

    #[test]
    fn test_extract_entry_basic() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "test.zip", &[("hello.txt", b"hello world")]);
        let dest = dir.path().join("out");
        fs::create_dir_all(&dest).unwrap();

        extract_entry(
            &zip_path,
            &PathBuf::from("hello.txt"),
            &dest.join("hello.txt"),
            |_| {},
            |_| Ok(true),
        ).unwrap();

        assert!(dest.join("hello.txt").exists());
        assert_eq!(fs::read_to_string(dest.join("hello.txt")).unwrap(), "hello world");
    }

    #[test]
    fn test_extract_entry_with_conflict_overwrite() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "test.zip", &[("file.txt", b"new content")]);
        let dest = dir.path().join("out");
        fs::create_dir_all(&dest).unwrap();
        // Pre-create the file with old content
        fs::write(dest.join("file.txt"), "old content").unwrap();

        extract_entry(
            &zip_path,
            &PathBuf::from("file.txt"),
            &dest.join("file.txt"),
            |_| {},
            |_| Ok(true), // Overwrite
        ).unwrap();

        assert_eq!(fs::read_to_string(dest.join("file.txt")).unwrap(), "new content");
    }

    #[test]
    fn test_extract_entry_with_conflict_skip() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "test.zip", &[("file.txt", b"new content")]);
        let dest = dir.path().join("out");
        fs::create_dir_all(&dest).unwrap();
        // Pre-create the file with old content
        fs::write(dest.join("file.txt"), "old content").unwrap();

        extract_entry(
            &zip_path,
            &PathBuf::from("file.txt"),
            &dest.join("file.txt"),
            |_| {},
            |_| Ok(false), // Skip
        ).unwrap();

        // Should still have old content since we skipped
        assert_eq!(fs::read_to_string(dest.join("file.txt")).unwrap(), "old content");
    }

    #[test]
    fn test_parse_archive_path_case_sensitivity() {
        // .ZIP (uppercase) should NOT match since the code checks lowercase extensions
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "test.zip", &[("a.txt", b"x")]);
        // Verify lowercase .zip works
        let full = format!("{}/a.txt", zip_path.to_string_lossy());
        assert!(parse_archive_path(&full).is_some());

        // Non-archive extension should return None
        let result = parse_archive_path("/some/path/file.ZIP/inner.txt");
        assert!(result.is_none());
    }

    #[test]
    fn test_add_then_list_roundtrip() {
        let dir = TempDir::new().unwrap();
        let zip_path = create_test_zip(dir.path(), "roundtrip.zip", &[]);

        // Add files
        let f1 = dir.path().join("doc.txt");
        let f2 = dir.path().join("image.png");
        fs::write(&f1, "document content").unwrap();
        fs::write(&f2, "fake png data").unwrap();

        add_files_to_zip(&zip_path, &[
            f1.to_string_lossy().to_string(),
            f2.to_string_lossy().to_string(),
        ], "").unwrap();

        // List and verify
        let contents = list_archive_contents(&zip_path, &PathBuf::new()).unwrap();
        assert_eq!(contents.len(), 2);

        // Read back content
        let doc = read_archive_file(&zip_path, &PathBuf::from("doc.txt")).unwrap();
        assert_eq!(doc, "document content");

        let img = read_archive_file(&zip_path, &PathBuf::from("image.png")).unwrap();
        assert_eq!(img, "fake png data");
    }
}

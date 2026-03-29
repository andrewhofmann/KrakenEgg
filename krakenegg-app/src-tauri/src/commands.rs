use std::fs;
use std::process::Command;
use std::path::{Path, PathBuf};
use std::io::{self, Read};
use std::time::UNIX_EPOCH;
use std::os::unix::fs::PermissionsExt;
use walkdir::WalkDir;
use tauri::{State, Emitter, Window};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::sync::mpsc;
use std::collections::HashMap;

use crate::models::{FileInfo, OperationMap, OperationContext, ConflictResolution};
use crate::utils::is_text_file_by_extension;
use crate::archive::{parse_archive_path, list_archive_contents, extract_entry, add_files_to_zip, remove_files_from_zip};
use crate::app_state::{AppStateConfig, get_config_path, save_state_to_file, load_state_from_file};

#[derive(Clone, serde::Serialize)]
struct ProgressPayload {
    id: String,
    total: usize,
    current: usize,
    path: String,
    bytes_done: u64,
    bytes_total: u64,
}

#[derive(Clone, serde::Serialize)]
struct ConflictPayload {
    id: String,
    source: String,
    dest: String,
    is_dir: bool,
}

#[derive(serde::Serialize)]
pub struct RecursiveInfo {
    files: usize,
    folders: usize,
    size: u64,
    skipped: usize,
}

struct TempDirGuard {
    path: PathBuf,
}

impl Drop for TempDirGuard {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.path);
    }
}

fn file_contains_content(path: &Path, query_lower: &str) -> bool {
    if let Ok(file) = fs::File::open(path) {
        let mut reader = io::BufReader::new(file);
        // Search first 200KB
        let mut buffer = vec![0; 200 * 1024]; 
        if let Ok(n) = reader.read(&mut buffer) {
             if n == 0 { return false; }
             let slice = &buffer[..n];
             if crate::utils::is_binary(slice) { return false; }
             
             // Naive implementation: convert to string and search
             // Optimization: Use memchr or regex bytes if needed, but String conversion is safest for UTF-8 case insensitivity
             let content = String::from_utf8_lossy(slice).to_lowercase();
             return content.contains(query_lower);
        }
    }
    false
}

#[tauri::command]
pub async fn get_recursive_info(path: String) -> Result<RecursiveInfo, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let root = Path::new(&path);
        if !root.exists() {
            return Err("Path does not exist".to_string());
        }

        if root.is_file() {
            let metadata = fs::metadata(root).map_err(|e| e.to_string())?;
            return Ok(RecursiveInfo {
                files: 1,
                folders: 0,
                size: metadata.len(),
                skipped: 0,
            });
        }

        let mut files = 0;
        let mut folders = 0;
        let mut size: u64 = 0;
        let mut skipped = 0;

        for entry in WalkDir::new(root) {
            match entry {
                Ok(entry) => {
                    let p = entry.path();
                    if p == root { continue; }

                    if p.is_file() {
                        files += 1;
                        size += entry.metadata().map(|m| m.len()).unwrap_or(0);
                    } else if p.is_dir() {
                        folders += 1;
                    }
                }
                Err(_) => {
                    skipped += 1;
                }
            }
        }

        Ok(RecursiveInfo { files, folders, size, skipped })
    }).await.map_err(|e| format!("Task failed: {}", e))?
}

/// Calculate folder size on demand (e.g., Space key on a folder like Total Commander)
#[tauri::command]
pub async fn calculate_folder_size(path: String) -> Result<u64, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let root = Path::new(&path);
        if !root.exists() {
            return Err("Path does not exist".to_string());
        }
        if !root.is_dir() {
            return fs::metadata(root).map(|m| m.len()).map_err(|e| e.to_string());
        }

        let mut size: u64 = 0;
        for entry in WalkDir::new(root).into_iter().flatten() {
            if entry.path().is_file() {
                size += entry.metadata().map(|m| m.len()).unwrap_or(0);
            }
        }
        Ok(size)
    }).await.map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub fn cancel_operation(id: String, state: State<'_, OperationMap>) {
    let map = state.0.lock().map_err(|_| "Failed to lock mutex".to_string());
    if let Ok(map) = map {
    if let Some(ctx) = map.get(&id) {
        ctx.cancel.store(true, Ordering::Relaxed);
        if let Some(tx) = &ctx.resolution_tx {
            let _ = tx.send(ConflictResolution::Cancel);
        }
    }
    }
}

#[tauri::command]
pub fn resolve_conflict(id: String, resolution: String, state: State<'_, OperationMap>) {
    let map = state.0.lock().map_err(|_| "Failed to lock mutex".to_string());
    if let Ok(map) = map {
    if let Some(ctx) = map.get(&id) {
        if let Some(tx) = &ctx.resolution_tx {
            let res = match resolution.as_str() {
                "Overwrite" => ConflictResolution::Overwrite,
                "Skip" => ConflictResolution::Skip,
                "OverwriteAll" => ConflictResolution::OverwriteAll,
                "SkipAll" => ConflictResolution::SkipAll,
                _ => ConflictResolution::Cancel,
            };
            let _ = tx.send(res);
        }
    }
    }
}

#[tauri::command]
pub async fn list_directory(path: String) -> Result<Vec<FileInfo>, String> {
    if let Some((archive_file_path, internal_path)) = parse_archive_path(&path) {
        return list_archive_contents(&archive_file_path, &internal_path);
    }

    let path_clone = path.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let entries = fs::read_dir(&path_clone)
            .map_err(|e| format!("Failed to read directory '{}': {}", path_clone, e))?;

        let mut files: Vec<FileInfo> = entries
            .filter_map(|entry| {
                let entry = entry.ok()?;
                let symlink_meta = entry.metadata().ok();
                let file_type = entry.file_type().ok()?;
                let is_symlink = file_type.is_symlink();

                // Use metadata (follows symlinks) for size/dates, file_type for symlink detection
                let metadata = if is_symlink {
                    fs::metadata(entry.path()).ok().or(symlink_meta)
                } else {
                    symlink_meta
                }?;

                let modified_at = metadata.modified().ok()
                    .and_then(|st| st.duration_since(UNIX_EPOCH).ok().map(|d| d.as_secs()));
                let created_at = metadata.created().ok()
                    .and_then(|st| st.duration_since(UNIX_EPOCH).ok().map(|d| d.as_secs()));
                #[cfg(unix)]
                let permissions = Some(metadata.permissions().mode());
                #[cfg(not(unix))]
                let permissions = None;

                let name = entry.file_name().to_string_lossy().to_string();
                let is_dir = metadata.is_dir();

                // Extract lowercase extension
                let extension = if !is_dir {
                    Path::new(&name).extension()
                        .and_then(|e| e.to_str())
                        .map(|e| e.to_lowercase())
                } else {
                    None
                };

                Some(FileInfo {
                    name,
                    is_dir,
                    size: metadata.len(),
                    modified_at,
                    created_at,
                    permissions,
                    extension,
                    is_symlink,
                })
            })
            .collect();

        // Pre-compute lowercase names for sorting to avoid repeated allocation
        files.sort_by(|a, b| {
            if a.name == ".." {
                std::cmp::Ordering::Less
            } else if b.name == ".." {
                std::cmp::Ordering::Greater
            } else if a.is_dir == b.is_dir {
                a.name.to_lowercase().cmp(&b.name.to_lowercase())
            } else {
                b.is_dir.cmp(&a.is_dir)
            }
        });

        Ok(files)
    }).await.map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub fn copy_items(sources: Vec<String>, dest: String) -> Result<(), String> {
    let dest_path = Path::new(&dest);
    for src in sources {
        let src_path = Path::new(&src);
        let name = src_path.file_name().ok_or("Invalid source name")?;
        let target = dest_path.join(name);
        crate::utils::copy_recursive(src_path, &target).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn copy_items_with_progress(
    window: Window,
    state: State<'_, OperationMap>,
    id: String,
    sources: Vec<String>,
    dest: String
) -> Result<(), String> {
    let token = Arc::new(AtomicBool::new(false));
    let (tx, rx) = mpsc::channel();
    
    {
        if let Ok(mut map) = state.0.lock() {
            map.insert(id.clone(), OperationContext {
                cancel: token.clone(),
                resolution_tx: Some(tx),
            });
        }
    }

    // --- Virtual Destination Logic (Add to Archive) ---
    if let Some((archive_path, internal_path)) = parse_archive_path(&dest) {
        let temp_dir = std::env::temp_dir().join(format!("kraken_staging_{}", id));
        let _guard = TempDirGuard { path: temp_dir.clone() }; // Ensure cleanup
        
        fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;
        
        let mut physical_sources = Vec::new();

        for src in &sources {
            if let Some((src_archive, src_internal)) = parse_archive_path(src) {
                let src_name = Path::new(src).file_name().unwrap_or_default();
                let staging_path = temp_dir.join(src_name);
                
                extract_entry(&src_archive, &src_internal, &temp_dir, |_| {}, |_| Ok(true)).map_err(|e| e.to_string())?;
                physical_sources.push(staging_path.to_string_lossy().to_string());
            } else {
                physical_sources.push(src.clone());
            }
        }

        let result = add_files_to_zip(&archive_path, &physical_sources, &internal_path.to_string_lossy());
        
        if let Ok(mut map) = state.0.lock() { map.remove(&id); }
        return result;
    }


    // --- Physical Destination Logic ---
    // Pre-calculate total bytes for progress tracking
    let mut bytes_total: u64 = 0;
    for src in &sources {
        if parse_archive_path(src).is_some() { continue; }
        let src_path = Path::new(src);
        if src_path.is_file() {
            bytes_total += fs::metadata(src_path).map(|m| m.len()).unwrap_or(0);
        } else if src_path.is_dir() {
            for e in WalkDir::new(src_path).into_iter().flatten() {
                if e.path().is_file() {
                    bytes_total += e.metadata().map(|m| m.len()).unwrap_or(0);
                }
            }
        }
    }

    let mut current = 0;
    let mut bytes_done: u64 = 0;
    let dest_path = Path::new(&dest);
    
    let mut auto_overwrite = false;
    let mut auto_skip = false;

    for src in sources {
        if token.load(Ordering::Relaxed) { break; } 
        
        let src_path = Path::new(&src);
        let file_name = src_path.file_name().ok_or("Invalid source name")?;
        let target_root = dest_path.join(file_name); 

        // --- Archive Extraction Logic (Virtual Source -> Physical Dest) ---
        if let Some((archive_path, internal_path)) = parse_archive_path(&src) {
            if !internal_path.as_os_str().is_empty() {
                extract_entry(&archive_path, &internal_path, &target_root,
                    |path| {
                        current += 1;
                        if current % 5 == 0 {
                            let _ = window.emit("progress", ProgressPayload {
                                id: id.clone(), total: current + 1, current, path: path.to_string(), bytes_done: 0, bytes_total: 0
                            });
                        }
                    },
                    |path| {
                        if path.exists() {
                            if auto_skip { return Ok(false); }
                            if !auto_overwrite {
                                let _ = window.emit("conflict", ConflictPayload {
                                    id: id.clone(),
                                    source: "Archive Content".to_string(), 
                                    dest: path.to_string_lossy().to_string(),
                                    is_dir: path.is_dir()
                                });
                                
                                if let Ok(res) = rx.recv() {
                                    match res {
                                        ConflictResolution::Overwrite => Ok(true), 
                                        ConflictResolution::OverwriteAll => { auto_overwrite = true; Ok(true) },
                                        ConflictResolution::Skip => Ok(false),
                                        ConflictResolution::SkipAll => { auto_skip = true; Ok(false) },
                                        ConflictResolution::Cancel => Err("Cancelled".into())
                                    }
                                } else { Err("Resolution channel error".into()) }
                            } else {
                                Ok(true)
                            }
                        } else {
                            Ok(true)
                        }
                    }
                ).map_err(|e| e.to_string())?;
                
                continue;
            }
        }

        // --- Physical Copy Logic ---
        if target_root.exists() {
            if auto_skip { continue; }
            if !auto_overwrite {
                let _ = window.emit("conflict", ConflictPayload {
                    id: id.clone(),
                    source: src.clone(),
                    dest: target_root.to_string_lossy().to_string(),
                    is_dir: src_path.is_dir()
                });
                
                if let Ok(res) = rx.recv() {
                    match res {
                        ConflictResolution::Overwrite => {}, 
                        ConflictResolution::OverwriteAll => { auto_overwrite = true; },
                        ConflictResolution::Skip => { continue; },
                        ConflictResolution::SkipAll => { auto_skip = true; continue; },
                        ConflictResolution::Cancel => { return Err("Cancelled".into()); }
                    }
                } else {
                    return Err("Resolution channel error".into());
                }
            }
        }

        if src_path.is_file() {
            let file_size = fs::metadata(src_path).map(|m| m.len()).unwrap_or(0);
            if let Err(e) = fs::copy(src_path, &target_root) {
                return Err(e.to_string());
            }
            current += 1;
            bytes_done += file_size;
            let _ = window.emit("progress", ProgressPayload {
                id: id.clone(), total: 0, current, path: src.clone(), bytes_done, bytes_total
            });
        } else if src_path.is_dir() {
            if let Err(e) = fs::create_dir_all(&target_root) {
                return Err(e.to_string());
            }
            
            for entry in WalkDir::new(src_path).min_depth(1) {
                if token.load(Ordering::Relaxed) { break; }

                let entry = entry.map_err(|e| e.to_string())?;
                let path = entry.path();
                let rel_path = path.strip_prefix(src_path).map_err(|e| e.to_string())?;
                let target = target_root.join(rel_path);

                if target.exists() {
                    if auto_skip { continue; }
                    if !auto_overwrite {
                         let _ = window.emit("conflict", ConflictPayload {
                            id: id.clone(),
                            source: path.to_string_lossy().to_string(),
                            dest: target.to_string_lossy().to_string(),
                            is_dir: path.is_dir()
                        });
                        
                        if let Ok(res) = rx.recv() {
                            match res {
                                ConflictResolution::Overwrite => {}, 
                                ConflictResolution::OverwriteAll => { auto_overwrite = true; },
                                ConflictResolution::Skip => { continue; },
                                ConflictResolution::SkipAll => { auto_skip = true; continue; },
                                ConflictResolution::Cancel => { return Err("Cancelled".into()); }
                            }
                        } else {
                            return Err("Resolution channel error".into());
                        }
                    }
                }

                if path.is_dir() {
                    fs::create_dir_all(&target).map_err(|e| e.to_string())?;
                } else {
                    let file_size = entry.metadata().map(|m| m.len()).unwrap_or(0);
                    fs::copy(path, &target).map_err(|e| e.to_string())?;
                    bytes_done += file_size;
                }

                current += 1;
                if current % 10 == 0 {
                     let _ = window.emit("progress", ProgressPayload {
                        id: id.clone(), total: 0, current, path: path.to_string_lossy().to_string(), bytes_done, bytes_total
                    });
                }
            }
        }
    }

    {
        if let Ok(mut map) = state.0.lock() {
            map.remove(&id);
        }
    }

    if token.load(Ordering::Relaxed) {
        Err("Operation cancelled".to_string())
    } else {
        Ok(())
    }
}

#[tauri::command]
pub async fn rename_item(old_path: String, new_path: String) -> Result<(), String> {
    let src = Path::new(&old_path);
    let dst = Path::new(&new_path);
    if dst.exists() {
        return Err(format!("'{}' already exists", dst.file_name().unwrap_or_default().to_string_lossy()));
    }
    fs::rename(src, dst).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn move_items(sources: Vec<String>, dest: String) -> Result<(), String> {
    let dest_path = Path::new(&dest);
    for src in sources {
        let src_path = Path::new(&src);
        let name = src_path.file_name().ok_or("Invalid source name")?;
        let target = dest_path.join(name);
        
        if fs::rename(src_path, &target).is_err() {
            crate::utils::copy_recursive(src_path, &target).map_err(|e| e.to_string())?;
            crate::utils::delete_recursive(src_path).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn move_items_with_progress(
    window: Window,
    state: State<'_, OperationMap>,
    id: String,
    sources: Vec<String>,
    dest: String
) -> Result<(), String> {
    let dest_path = Path::new(&dest);

    // Check for Virtual Paths
    let is_virtual_op = parse_archive_path(&dest).is_some() || sources.iter().any(|s| parse_archive_path(s).is_some());

    if !is_virtual_op {
        // Try fast rename for ALL sources first — only use this path if ALL can be renamed
        // (same filesystem, no conflicts). If any would fail, fall back to copy+delete for ALL.
        let can_fast_rename = sources.iter().all(|src| {
            let src_path = Path::new(src);
            if let Some(file_name) = src_path.file_name() {
                let target = dest_path.join(file_name);
                !target.exists() // No conflict
            } else {
                false
            }
        });

        if can_fast_rename {
            let mut rename_ok = true;
            let mut renamed: Vec<(String, std::path::PathBuf)> = Vec::new();
            for src in &sources {
                let src_path = Path::new(src);
                let file_name = src_path.file_name().ok_or("Invalid source")?;
                let target = dest_path.join(file_name);
                if fs::rename(src_path, &target).is_ok() {
                    renamed.push((src.clone(), target));
                } else {
                    // Rename failed (cross-device?) — undo what we did and fall back
                    for (orig, moved) in renamed.iter().rev() {
                        let _ = fs::rename(moved, orig);
                    }
                    rename_ok = false;
                    break;
                }
            }
            if rename_ok {
                return Ok(());
            }
        }
    }

    copy_items_with_progress(window.clone(), state.clone(), id.clone(), sources.clone(), dest).await?;
    delete_items_with_progress(window, state, id, sources).await?;
    Ok(())
}


#[tauri::command]
pub async fn delete_items(paths: Vec<String>) -> Result<(), String> {
    for path in paths {
        let p = Path::new(&path);
        crate::utils::delete_recursive(p).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn delete_items_with_progress(
    window: Window,
    state: State<'_, OperationMap>,
    id: String,
    paths: Vec<String>
) -> Result<(), String> {
    let token = Arc::new(AtomicBool::new(false));
    {
        if let Ok(mut map) = state.0.lock() {
            map.insert(id.clone(), OperationContext {
                cancel: token.clone(),
                resolution_tx: None, 
            });
        }
    }

    let mut archive_deletions: HashMap<PathBuf, Vec<String>> = HashMap::new();
    let mut physical_deletions: Vec<String> = Vec::new();

    for path in &paths {
        if let Some((archive_path, internal_path)) = parse_archive_path(path) {
             if internal_path.as_os_str().is_empty() {
                 physical_deletions.push(path.clone());
             } else {
                 archive_deletions.entry(archive_path).or_default().push(internal_path.to_string_lossy().to_string());
             }
        } else {
             physical_deletions.push(path.clone());
        }
    }

    for (archive, targets) in archive_deletions {
        if token.load(Ordering::Relaxed) { break; }
        remove_files_from_zip(&archive, &targets).map_err(|e| e.to_string())?;
    }

    // Pre-calculate total bytes for progress
    let mut bytes_total: u64 = 0;
    for path in &physical_deletions {
        let p = Path::new(path);
        if p.is_file() {
            bytes_total += fs::metadata(p).map(|m| m.len()).unwrap_or(0);
        } else if p.is_dir() {
            for e in WalkDir::new(p).into_iter().flatten() {
                if e.path().is_file() {
                    bytes_total += e.metadata().map(|m| m.len()).unwrap_or(0);
                }
            }
        }
    }

    let mut current = 0;
    let mut bytes_done: u64 = 0;

    for path in physical_deletions {
        if token.load(Ordering::Relaxed) { break; }
        let p = Path::new(&path);

        if p.is_file() {
            let file_size = fs::metadata(p).map(|m| m.len()).unwrap_or(0);
            if let Err(e) = fs::remove_file(p) { return Err(e.to_string()); }
            current += 1;
            bytes_done += file_size;
            let _ = window.emit("progress", ProgressPayload { id: id.clone(), total: 0, current, path: path.clone(), bytes_done, bytes_total });
        } else if p.is_dir() {
            for entry in WalkDir::new(p).contents_first(true) {
                if token.load(Ordering::Relaxed) { break; }
                let entry = entry.map_err(|e| e.to_string())?;
                let entry_path = entry.path();

                if entry_path.is_dir() {
                    fs::remove_dir(entry_path).map_err(|e| e.to_string())?;
                } else {
                    let file_size = entry.metadata().map(|m| m.len()).unwrap_or(0);
                    fs::remove_file(entry_path).map_err(|e| e.to_string())?;
                    bytes_done += file_size;
                }

                current += 1;
                if current % 10 == 0 {
                    let _ = window.emit("progress", ProgressPayload {
                        id: id.clone(), total: 0, current, path: entry_path.to_string_lossy().to_string(), bytes_done, bytes_total
                    });
                }
            }
            let _ = fs::remove_dir(p);
        }
    }

    if let Ok(mut map) = state.0.lock() { map.remove(&id); }

    if token.load(Ordering::Relaxed) {
        Err("Operation cancelled".to_string())
    } else {
        Ok(())
    }
}

#[tauri::command]
pub async fn compress_files(sources: Vec<String>, dest_path: String) -> Result<(), String> {
    compress_rust_zip(&sources, &dest_path, true)
}

// Multi-strategy compressor with detailed error reporting
#[tauri::command]
pub async fn compress_files_with_progress(
    window: Window,
    _state: State<'_, OperationMap>,
    _id: String,
    sources: Vec<String>,
    dest_path: String
) -> Result<(), String> {
    let mut errors = String::new();

    // Strategy 1: Rust Zip Deflate
    match compress_rust_zip(&sources, &dest_path, true) {
        Ok(_) => { let _ = window.emit("operation_success", "Strategy 1 (Rust Deflate) Succeeded"); return Ok(()); }
        Err(e) => errors.push_str(&format!("RustZip(Deflate): {}; ", e)),
    }

    // Strategy 2: Rust Zip Stored
    match compress_rust_zip(&sources, &dest_path, false) {
        Ok(_) => { let _ = window.emit("operation_success", "Strategy 2 (Rust Stored) Succeeded"); return Ok(()); }
        Err(e) => errors.push_str(&format!("RustZip(Stored): {}; ", e)),
    }

    // Strategy 3: System Zip
    match compress_system_zip(&sources, &dest_path) {
        Ok(_) => { let _ = window.emit("operation_success", "Strategy 3 (System Zip) Succeeded"); return Ok(()); }
        Err(e) => errors.push_str(&format!("SystemZip: {}; ", e)),
    }

    // Strategy 4: System Ditto
    match compress_system_ditto(&sources, &dest_path) {
        Ok(_) => { let _ = window.emit("operation_success", "Strategy 4 (Ditto) Succeeded"); return Ok(()); }
        Err(e) => errors.push_str(&format!("Ditto: {}; ", e)),
    }

    Err(format!("All strategies failed: {}", errors))
}

// Helpers
fn compress_rust_zip(sources: &[String], dest_path: &str, deflate: bool) -> Result<(), String> {
    let path = Path::new(dest_path);
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            return Err(format!("Parent dir does not exist: {:?}", parent));
        }
    }

    let file = fs::File::create(path).map_err(|e| format!("Create failed: {}", e))?;
    let dest_canon = fs::canonicalize(path).ok();
    
    let mut zip = zip::ZipWriter::new(file);
    let method = if deflate { zip::CompressionMethod::Deflated } else { zip::CompressionMethod::Stored };
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(method)
        .large_file(true);

    for src in sources {
        let src_path = Path::new(src);
        let src_name = src_path.file_name().unwrap_or_default().to_string_lossy();

        if src_path.is_dir() {
            let walk = WalkDir::new(src_path);
            for entry in walk {
                let entry = entry.map_err(|e| e.to_string())?;
                let path = entry.path();
                
                if let Ok(meta) = fs::symlink_metadata(path) {
                    if meta.file_type().is_symlink() { continue; }
                }

                if let (Some(d), Ok(p)) = (&dest_canon, fs::canonicalize(path)) {
                    if d == &p { continue; }
                }

                let relative_to_root = if let Some(parent) = src_path.parent() {
                    path.strip_prefix(parent).unwrap_or(path)
                } else {
                    path
                };
                let name = relative_to_root.to_string_lossy().replace("\\\\", "/");
                let name = name.trim_start_matches('/').to_string();
                
                if path.is_file() {
                    zip.start_file(name, options).map_err(|e| e.to_string())?;
                    let mut f = fs::File::open(path).map_err(|e| e.to_string())?;
                    io::copy(&mut f, &mut zip).map_err(|e| e.to_string())?;
                } else if !name.is_empty() {
                    zip.add_directory(name, options).map_err(|e| e.to_string())?;
                }
            }
        } else {
            if let (Some(d), Ok(p)) = (&dest_canon, fs::canonicalize(src_path)) {
                if d == &p { continue; }
            }
            
            let name = src_name.clone().to_string();
            zip.start_file(name, options).map_err(|e| e.to_string())?;
            let mut f = fs::File::open(src_path).map_err(|e| e.to_string())?;
            io::copy(&mut f, &mut zip).map_err(|e| e.to_string())?;
        }
    }
    zip.finish().map_err(|e| e.to_string())?;
    Ok(())
}

fn compress_system_zip(sources: &[String], dest_path: &str) -> Result<(), String> {
    let mut cmd = Command::new("zip");
    cmd.arg("-r").arg(dest_path).args(sources);
    let output = cmd.output().map_err(|e| e.to_string())?;
    if output.status.success() { Ok(()) } else { Err(String::from_utf8_lossy(&output.stderr).to_string()) }
}

fn compress_system_ditto(sources: &[String], dest_path: &str) -> Result<(), String> {
    if sources.len() != 1 { return Err("Ditto requires 1 source".to_string()); }
    let output = Command::new("ditto")
        .arg("-c").arg("-k")
        .arg(&sources[0])
        .arg(dest_path)
        .output()
        .map_err(|e| e.to_string())?;
    if output.status.success() { Ok(()) } else { Err(String::from_utf8_lossy(&output.stderr).to_string()) }
}

#[tauri::command]
pub async fn extract_archive(archive_path: String, dest_dir: String) -> Result<(), String> {
    let archive_p = Path::new(&archive_path);
    let dest_p = Path::new(&dest_dir);
    let internal_p = Path::new(""); // Root
    
    extract_entry(archive_p, internal_p, dest_p, 
        |_| {}, // No progress reporting
        |_| Ok(true) // Always overwrite
    )
}

#[tauri::command]
pub async fn create_directory(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if p.exists() {
        return Err(format!("'{}' already exists", p.file_name().unwrap_or_default().to_string_lossy()));
    }
    fs::create_dir_all(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn preview_file(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        // Spawn qlmanage without blocking — it opens its own window
        Command::new("qlmanage")
            .arg("-p")
            .arg(&path)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    {
        Err("Quick Look is only available on macOS".to_string())
    }
}

#[tauri::command]
pub async fn read_file_content(path: String) -> Result<String, String> {
    if let Some((archive_path, internal_path)) = crate::archive::parse_archive_path(&path) {
        return crate::archive::read_archive_file(&archive_path, &internal_path);
    }

    use std::io::Read;
    let file = fs::File::open(&path).map_err(|e| e.to_string())?;
    let mut buffer = Vec::new();
    // Read up to 5MB for viewing — large enough for most text files
    file.take(5 * 1024 * 1024).read_to_end(&mut buffer).map_err(|e| e.to_string())?;
    // Check for binary content before attempting UTF-8 conversion
    if crate::utils::is_binary(&buffer) {
        return Err(format!("Binary file ({} bytes) — cannot display as text", buffer.len()));
    }
    match String::from_utf8(buffer) {
        Ok(s) => Ok(s),
        Err(e) => {
            // Fallback to lossy conversion for files with mixed encoding
            Ok(String::from_utf8_lossy(e.as_bytes()).into_owned())
        }
    }
}

#[tauri::command]
pub async fn write_file_content(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_empty_file(path: String) -> Result<(), String> {
    // Use create_new to fail if file already exists instead of silently truncating
    std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&path)
        .map_err(|e| format!("Failed to create file '{}': {}", path, e))?;
    Ok(())
}

#[tauri::command]
pub async fn save_app_state(state: AppStateConfig) -> Result<(), String> {
    let config_path = get_config_path(None)?;
    save_state_to_file(&state, &config_path)
}

#[tauri::command]
pub async fn load_app_state() -> Result<Option<AppStateConfig>, String> {
    let config_path = get_config_path(None)?;
    load_state_from_file(&config_path)
}

use regex::Regex;

#[tauri::command]
pub async fn search_files(query: String, path: String, search_content: bool, search_mode: Option<String>) -> Result<Vec<FileInfo>, String> {
    let mut files: Vec<FileInfo> = Vec::new();
    let query_lower = query.to_lowercase();
    let root_path = Path::new(&path);
    let mode = search_mode.as_deref().unwrap_or("substring");

    // Build matcher based on mode
    let regex = match mode {
        "regex" => {
            Some(Regex::new(&query).map_err(|e| format!("Invalid regex: {}", e))?)
        }
        "glob" => {
            // Convert glob to regex: * → .*, ? → ., escape other special chars
            let pattern = query.chars().fold(String::new(), |mut acc, c| {
                match c {
                    '*' => acc.push_str(".*"),
                    '?' => acc.push('.'),
                    '.' | '+' | '(' | ')' | '[' | ']' | '{' | '}' | '^' | '$' | '|' | '\\' => {
                        acc.push('\\');
                        acc.push(c);
                    }
                    _ => acc.push(c),
                }
                acc
            });
            Some(Regex::new(&format!("(?i)^{}$", pattern)).map_err(|e| format!("Invalid glob: {}", e))?)
        }
        _ => None, // substring mode
    };

    // Skip hidden directories entirely (don't traverse into them) but allow the root itself
    let walker = WalkDir::new(root_path).into_iter().filter_entry(|e| {
        let name = e.file_name().to_string_lossy();
        // Allow root directory (depth 0) even if hidden, skip all other hidden dirs
        e.depth() == 0 || !name.starts_with('.')
    }).filter_map(|e| e.ok());

    for entry in walker {
        let entry_path = entry.path();
        let file_name_os = entry.file_name();
        let file_name = file_name_os.to_string_lossy();

        // Skip hidden files (hidden dirs already filtered by walker)
        if entry.depth() > 0 && file_name.starts_with('.') {
            continue;
        }

        let mut match_found = false;

        match (&regex, mode) {
            (Some(rx), _) => {
                if rx.is_match(&file_name) {
                    match_found = true;
                }
            }
            _ => {
                if file_name.to_lowercase().contains(&query_lower) {
                    match_found = true;
                }
            }
        }

        if !match_found && search_content && entry.file_type().is_file() && is_text_file_by_extension(entry_path)
             && file_contains_content(entry_path, &query_lower) {
                 match_found = true;
             }

        if match_found {
             let metadata = entry.metadata().map_err(|e| e.to_string())?;
             
             let relative_path = entry_path.strip_prefix(root_path)
                .unwrap_or(entry_path)
                .to_string_lossy()
                .to_string();

             if relative_path.is_empty() {
                 continue;
             }

             let modified_at = metadata.modified().ok() 
                .and_then(|st| st.duration_since(UNIX_EPOCH).ok().map(|d| d.as_secs()));
             let created_at = metadata.created().ok() 
                .and_then(|st| st.duration_since(UNIX_EPOCH).ok().map(|d| d.as_secs()));
            #[cfg(unix)]
            let permissions = Some(metadata.permissions().mode());
            #[cfg(not(unix))]
            let permissions = None;

             let is_dir = metadata.is_dir();
             let extension = if !is_dir {
                 Path::new(&relative_path).extension()
                     .and_then(|e| e.to_str())
                     .map(|e| e.to_lowercase())
             } else {
                 None
             };
             files.push(FileInfo {
                name: relative_path,
                is_dir,
                size: metadata.len(),
                modified_at,
                created_at,
                permissions,
                extension,
                is_symlink: false,
             });
        }

        if files.len() >= 1000 {
            break;
        }
    }

    Ok(files)
}

#[tauri::command]
pub async fn open_with_default(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    let cmd = "open";
    #[cfg(target_os = "windows")]
    let cmd = "cmd";
    #[cfg(target_os = "linux")]
    let cmd = "xdg-open";

    let mut command = Command::new(cmd);
    
    #[cfg(target_os = "windows")]
    {
        command.arg("/C").arg("start").arg("").arg(&path);
    }
    #[cfg(not(target_os = "windows"))]
    {
        command.arg(&path);
    }

    let output = command.output().map_err(|e| e.to_string())?;
    
    if output.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

// System Commands
#[tauri::command]
pub fn get_home_directory() -> Result<String, String> {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not determine home directory".to_string())
}

// Layout Commands
#[tauri::command]
pub async fn save_named_layout(name: String, state: AppStateConfig) -> Result<(), String> {
    crate::app_state::save_named_layout(&name, &state)
}

#[tauri::command]
pub async fn load_named_layout(name: String) -> Result<Option<AppStateConfig>, String> {
    crate::app_state::load_named_layout(&name)
}

#[tauri::command]
pub async fn list_layouts() -> Result<Vec<String>, String> {
    crate::app_state::list_layouts()
}

// Filesystem watcher commands
use notify::{RecommendedWatcher, RecursiveMode, Watcher, Event};
use std::sync::Mutex;

#[tauri::command]
pub async fn watch_directory(
    path: String,
    window: Window,
    state: State<'_, WatcherMap>,
) -> Result<(), String> {
    let path_clone = path.clone();

    // Remove existing watcher for this path if any
    {
        let mut watchers = state.0.lock().map_err(|e| e.to_string())?;
        watchers.remove(&path);
    }

    let emit_path = path.clone();
    let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
        if let Ok(_event) = res {
            // Emit a directory-changed event to the frontend
            let _ = window.emit("directory-changed", &emit_path);
        }
    }).map_err(|e| format!("Failed to create watcher: {}", e))?;

    watcher.watch(Path::new(&path_clone), RecursiveMode::NonRecursive)
        .map_err(|e| format!("Failed to watch '{}': {}", path_clone, e))?;

    let mut watchers = state.0.lock().map_err(|e| e.to_string())?;
    watchers.insert(path, watcher);

    Ok(())
}

#[tauri::command]
pub async fn unwatch_directory(
    path: String,
    state: State<'_, WatcherMap>,
) -> Result<(), String> {
    let mut watchers = state.0.lock().map_err(|e| e.to_string())?;
    watchers.remove(&path);
    Ok(())
}

pub struct WatcherMap(pub Mutex<HashMap<String, RecommendedWatcher>>);

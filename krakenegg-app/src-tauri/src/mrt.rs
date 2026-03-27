use std::path::Path;
use std::fs;
use serde::{Serialize, Deserialize};
use regex::Regex;
use chrono::{DateTime, Local};
use std::time::SystemTime;

#[derive(Serialize, Clone)]
pub struct RenamePreview {
    original: String,
    new: String,
    status: String, // "ok", "error", "unchanged"
    error: Option<String>,
}

#[tauri::command]
pub fn preview_mrt(
    files: Vec<String>,
    name_pattern: String, // e.g. "[N]_[C]"
    ext_pattern: String,  // e.g. "[E]"
    counter_start: i32,
    counter_step: i32,
    counter_width: usize,
) -> Result<Vec<RenamePreview>, String> {
    let mut previews = Vec::new();
    let mut generated_names = std::collections::HashSet::new();

    let mut counter = counter_start;

    for file_path_str in &files {
        let path = Path::new(file_path_str);
        let parent = path.parent().unwrap_or(Path::new(""));
        
        let original_name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
        let stem = path.file_stem().unwrap_or_default().to_string_lossy().to_string();
        let ext = path.extension().unwrap_or_default().to_string_lossy().to_string();

        // 1. Process Name Pattern
        let mut new_stem = name_pattern.clone();
        new_stem = new_stem.replace("[N]", &stem);
        
        // Counter [C]
        let counter_str = format!("{:0width$}", counter, width = counter_width);
        new_stem = new_stem.replace("[C]", &counter_str);

        // Date [YMD] - YYYYMMDD
        if new_stem.contains("[YMD]") {
            if let Ok(meta) = fs::metadata(path) {
                if let Ok(modified) = meta.modified() {
                    let dt: DateTime<Local> = modified.into();
                    let date_str = dt.format("%Y%m%d").to_string();
                    new_stem = new_stem.replace("[YMD]", &date_str);
                }
            }
        }

        // 2. Process Ext Pattern
        let mut new_ext = ext_pattern.clone();
        new_ext = new_ext.replace("[E]", &ext);
        
        let new_filename = if new_ext.is_empty() {
            new_stem
        } else {
            format!("{}.{}", new_stem, new_ext)
        };

        let new_path = parent.join(&new_filename);
        let new_path_str = new_path.to_string_lossy().to_string();

        let mut status = "ok".to_string();
        let mut error = None;

        if new_filename == original_name {
            status = "unchanged".to_string();
        } else if generated_names.contains(&new_path_str) {
            status = "error".to_string();
            error = Some("Name collision (duplicate in list)".to_string());
        } else if new_path.exists() {
            status = "error".to_string();
            error = Some("File already exists".to_string());
        }

        generated_names.insert(new_path_str.clone());

        previews.push(RenamePreview {
            original: original_name,
            new: new_filename,
            status,
            error,
        });

        counter += counter_step;
    }

    Ok(previews)
}

#[tauri::command]
pub fn execute_mrt(
    files: Vec<String>,
    name_pattern: String,
    ext_pattern: String,
    counter_start: i32,
    counter_step: i32,
    counter_width: usize,
) -> Result<(), String> {
    // Re-run logic to ensure safety or rely on frontend passing valid list?
    // Safer to re-calculate to avoid race conditions or frontend hacks.
    
    let previews = preview_mrt(files.clone(), name_pattern, ext_pattern, counter_start, counter_step, counter_width)?;
    
    // Validate all
    for p in &previews {
        if p.status == "error" {
            return Err(format!("Cannot proceed: Error with '{}': {}", p.original, p.error.as_deref().unwrap_or("Unknown")));
        }
    }

    // Execute
    for (i, p) in previews.iter().enumerate() {
        if p.status == "unchanged" { continue; }
        
        let old_path = Path::new(&files[i]);
        let parent = old_path.parent().ok_or_else(|| format!("Cannot rename root directory: {}", files[i]))?;
        let new_path = parent.join(&p.new);
        
        fs::rename(old_path, new_path).map_err(|e| format!("Failed to rename '{}': {}", p.original, e))?;
    }

    Ok(())
}

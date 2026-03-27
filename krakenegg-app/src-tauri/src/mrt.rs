use std::path::Path;
use std::fs;
use serde::{Serialize, Deserialize};
use regex::Regex;
use chrono::{DateTime, Local};
use std::time::SystemTime;

#[derive(Serialize, Clone, Debug)]
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
    regex_find: Option<String>,     // Optional regex find pattern
    regex_replace: Option<String>,  // Optional regex replacement
    case_convert: Option<String>,   // "upper", "lower", "title", or None
) -> Result<Vec<RenamePreview>, String> {
    let mut previews = Vec::new();
    let mut generated_names = std::collections::HashSet::new();

    // Compile regex if provided
    let regex = if let Some(ref pattern) = regex_find {
        if !pattern.is_empty() {
            Some(Regex::new(pattern).map_err(|e| format!("Invalid regex: {}", e))?)
        } else {
            None
        }
    } else {
        None
    };

    let mut counter = counter_start;

    for file_path_str in &files {
        let path = Path::new(file_path_str);
        let parent = path.parent().unwrap_or(Path::new(""));

        let original_name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
        let stem = path.file_stem().unwrap_or_default().to_string_lossy().to_string();
        let ext = path.extension().unwrap_or_default().to_string_lossy().to_string();

        // 1. Process Name Pattern (token replacement)
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

        // 2. Apply regex find/replace if provided
        if let (Some(ref rx), Some(ref replacement)) = (&regex, &regex_replace) {
            new_stem = rx.replace_all(&new_stem, replacement.as_str()).to_string();
        }

        // 3. Apply case conversion
        if let Some(ref case) = case_convert {
            new_stem = match case.as_str() {
                "upper" => new_stem.to_uppercase(),
                "lower" => new_stem.to_lowercase(),
                "title" => new_stem.split_whitespace()
                    .map(|w| {
                        let mut c = w.chars();
                        match c.next() {
                            None => String::new(),
                            Some(f) => f.to_uppercase().to_string() + &c.as_str().to_lowercase(),
                        }
                    })
                    .collect::<Vec<_>>()
                    .join(" "),
                _ => new_stem,
            };
        }

        // 4. Process Ext Pattern
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
    regex_find: Option<String>,
    regex_replace: Option<String>,
    case_convert: Option<String>,
) -> Result<(), String> {
    let previews = preview_mrt(files.clone(), name_pattern, ext_pattern, counter_start, counter_step, counter_width, regex_find, regex_replace, case_convert)?;
    
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

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_preview_mrt_name_pattern_preserves_name() {
        let dir = TempDir::new().unwrap();
        let file = dir.path().join("hello.txt");
        fs::write(&file, "").unwrap();
        let result = preview_mrt(
            vec![file.to_string_lossy().to_string()],
            "[N]".to_string(), "[E]".to_string(), 1, 1, 1, None, None, None,
        ).unwrap();
        assert_eq!(result[0].new, "hello.txt");
        assert_eq!(result[0].status, "unchanged");
    }

    #[test]
    fn test_preview_mrt_counter_increments() {
        let dir = TempDir::new().unwrap();
        let f1 = dir.path().join("a.txt");
        let f2 = dir.path().join("b.txt");
        fs::write(&f1, "").unwrap();
        fs::write(&f2, "").unwrap();
        let result = preview_mrt(
            vec![f1.to_string_lossy().to_string(), f2.to_string_lossy().to_string()],
            "file_[C]".to_string(), "[E]".to_string(), 1, 1, 3, None, None, None,
        ).unwrap();
        assert_eq!(result[0].new, "file_001.txt");
        assert_eq!(result[1].new, "file_002.txt");
    }

    #[test]
    fn test_preview_mrt_counter_width_zero_pads() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("test.txt");
        fs::write(&f, "").unwrap();
        let result = preview_mrt(
            vec![f.to_string_lossy().to_string()],
            "[C]".to_string(), "[E]".to_string(), 5, 1, 4, None, None, None,
        ).unwrap();
        assert_eq!(result[0].new, "0005.txt");
    }

    #[test]
    fn test_preview_mrt_detects_name_collision() {
        let dir = TempDir::new().unwrap();
        let f1 = dir.path().join("a.txt");
        let f2 = dir.path().join("b.txt");
        fs::write(&f1, "").unwrap();
        fs::write(&f2, "").unwrap();
        // Both will generate same name
        let result = preview_mrt(
            vec![f1.to_string_lossy().to_string(), f2.to_string_lossy().to_string()],
            "same".to_string(), "txt".to_string(), 1, 1, 1, None, None, None,
        ).unwrap();
        assert_eq!(result[0].status, "ok");
        assert_eq!(result[1].status, "error");
        assert!(result[1].error.as_ref().unwrap().contains("collision"));
    }

    #[test]
    fn test_preview_mrt_detects_existing_file_conflict() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("original.txt");
        let existing = dir.path().join("taken.txt");
        fs::write(&f, "").unwrap();
        fs::write(&existing, "").unwrap();
        let result = preview_mrt(
            vec![f.to_string_lossy().to_string()],
            "taken".to_string(), "txt".to_string(), 1, 1, 1, None, None, None,
        ).unwrap();
        assert_eq!(result[0].status, "error");
        assert!(result[0].error.as_ref().unwrap().contains("already exists"));
    }

    #[test]
    fn test_execute_mrt_renames_files() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("old.txt");
        fs::write(&f, "content").unwrap();
        execute_mrt(
            vec![f.to_string_lossy().to_string()],
            "new".to_string(), "[E]".to_string(), 1, 1, 1, None, None, None,
        ).unwrap();
        assert!(!f.exists());
        assert!(dir.path().join("new.txt").exists());
    }

    #[test]
    fn test_execute_mrt_aborts_on_error() {
        let dir = TempDir::new().unwrap();
        let f1 = dir.path().join("a.txt");
        let f2 = dir.path().join("b.txt");
        fs::write(&f1, "").unwrap();
        fs::write(&f2, "").unwrap();
        // Both produce same name -> error
        let result = execute_mrt(
            vec![f1.to_string_lossy().to_string(), f2.to_string_lossy().to_string()],
            "same".to_string(), "txt".to_string(), 1, 1, 1, None, None, None,
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_execute_mrt_skips_unchanged() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("keep.txt");
        fs::write(&f, "data").unwrap();
        execute_mrt(
            vec![f.to_string_lossy().to_string()],
            "[N]".to_string(), "[E]".to_string(), 1, 1, 1, None, None, None,
        ).unwrap();
        // File should still exist with original name
        assert!(f.exists());
    }

    #[test]
    fn test_preview_mrt_ext_pattern() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("file.txt");
        fs::write(&f, "").unwrap();
        let result = preview_mrt(
            vec![f.to_string_lossy().to_string()],
            "[N]".to_string(), "md".to_string(), 1, 1, 1, None, None, None,
        ).unwrap();
        assert_eq!(result[0].new, "file.md");
    }

    #[test]
    fn test_preview_mrt_regex_find_replace() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("photo_2024_01.jpg");
        fs::write(&f, "").unwrap();
        let result = preview_mrt(
            vec![f.to_string_lossy().to_string()],
            "[N]".to_string(), "[E]".to_string(), 1, 1, 1,
            Some(r"(\d{4})_(\d{2})".to_string()),
            Some("$1-$2".to_string()),
            None,
        ).unwrap();
        assert_eq!(result[0].new, "photo_2024-01.jpg");
    }

    #[test]
    fn test_preview_mrt_case_upper() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("hello.txt");
        fs::write(&f, "").unwrap();
        let result = preview_mrt(
            vec![f.to_string_lossy().to_string()],
            "[N]".to_string(), "[E]".to_string(), 1, 1, 1,
            None, None, Some("upper".to_string()),
        ).unwrap();
        assert_eq!(result[0].new, "HELLO.txt");
    }

    #[test]
    fn test_preview_mrt_case_lower() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("HELLO.TXT");
        fs::write(&f, "").unwrap();
        let result = preview_mrt(
            vec![f.to_string_lossy().to_string()],
            "[N]".to_string(), "[E]".to_string(), 1, 1, 1,
            None, None, Some("lower".to_string()),
        ).unwrap();
        assert_eq!(result[0].new, "hello.TXT");
    }

    #[test]
    fn test_preview_mrt_case_title() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("hello world.txt");
        fs::write(&f, "").unwrap();
        let result = preview_mrt(
            vec![f.to_string_lossy().to_string()],
            "[N]".to_string(), "[E]".to_string(), 1, 1, 1,
            None, None, Some("title".to_string()),
        ).unwrap();
        assert_eq!(result[0].new, "Hello World.txt");
    }

    #[test]
    fn test_preview_mrt_invalid_regex_returns_error() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("test.txt");
        fs::write(&f, "").unwrap();
        let result = preview_mrt(
            vec![f.to_string_lossy().to_string()],
            "[N]".to_string(), "[E]".to_string(), 1, 1, 1,
            Some("[invalid".to_string()), Some("x".to_string()), None,
        );
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid regex"));
    }

    #[test]
    fn test_preview_mrt_regex_and_case_combined() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("IMG_20240101.jpg");
        fs::write(&f, "").unwrap();
        let result = preview_mrt(
            vec![f.to_string_lossy().to_string()],
            "[N]".to_string(), "[E]".to_string(), 1, 1, 1,
            Some("IMG_".to_string()), Some("photo_".to_string()),
            Some("lower".to_string()),
        ).unwrap();
        assert_eq!(result[0].new, "photo_20240101.jpg");
    }
}

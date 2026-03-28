use std::path::Path;
use std::fs;
use serde::Serialize;
use regex::Regex;
use chrono::{DateTime, Local};

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

    #[test]
    fn test_preview_mrt_empty_file_list() {
        let result = preview_mrt(
            vec![], "[N]".to_string(), "[E]".to_string(), 1, 1, 1, None, None, None,
        ).unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_preview_mrt_no_extension_file() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("Makefile");
        fs::write(&f, "").unwrap();
        let result = preview_mrt(
            vec![f.to_string_lossy().to_string()],
            "renamed_[N]".to_string(), "[E]".to_string(), 1, 1, 1, None, None, None,
        ).unwrap();
        // No extension, so [E] is empty, new name should just be the stem
        assert_eq!(result[0].new, "renamed_Makefile");
    }

    #[test]
    fn test_preview_mrt_counter_step_2() {
        let dir = TempDir::new().unwrap();
        let f1 = dir.path().join("a.txt");
        let f2 = dir.path().join("b.txt");
        let f3 = dir.path().join("c.txt");
        fs::write(&f1, "").unwrap();
        fs::write(&f2, "").unwrap();
        fs::write(&f3, "").unwrap();
        let result = preview_mrt(
            vec![
                f1.to_string_lossy().to_string(),
                f2.to_string_lossy().to_string(),
                f3.to_string_lossy().to_string(),
            ],
            "item_[C]".to_string(), "[E]".to_string(), 1, 2, 2, None, None, None,
        ).unwrap();
        assert_eq!(result[0].new, "item_01.txt");
        assert_eq!(result[1].new, "item_03.txt");
        assert_eq!(result[2].new, "item_05.txt");
    }

    #[test]
    fn test_preview_mrt_counter_start_10() {
        let dir = TempDir::new().unwrap();
        let f1 = dir.path().join("x.txt");
        let f2 = dir.path().join("y.txt");
        fs::write(&f1, "").unwrap();
        fs::write(&f2, "").unwrap();
        let result = preview_mrt(
            vec![
                f1.to_string_lossy().to_string(),
                f2.to_string_lossy().to_string(),
            ],
            "file_[C]".to_string(), "[E]".to_string(), 10, 1, 3, None, None, None,
        ).unwrap();
        assert_eq!(result[0].new, "file_010.txt");
        assert_eq!(result[1].new, "file_011.txt");
    }

    #[test]
    fn test_preview_mrt_name_and_counter_combined() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("photo.jpg");
        fs::write(&f, "").unwrap();
        let result = preview_mrt(
            vec![f.to_string_lossy().to_string()],
            "[N]_[C]".to_string(), "[E]".to_string(), 1, 1, 3, None, None, None,
        ).unwrap();
        assert_eq!(result[0].new, "photo_001.jpg");
    }

    #[test]
    fn test_preview_mrt_ymd_pattern() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("report.pdf");
        fs::write(&f, "some content").unwrap();
        let result = preview_mrt(
            vec![f.to_string_lossy().to_string()],
            "[YMD]_[N]".to_string(), "[E]".to_string(), 1, 1, 1, None, None, None,
        ).unwrap();
        // The [YMD] should be replaced with a date string like 20260326
        assert_eq!(result[0].new.len(), "20260326_report.pdf".len());
        assert!(result[0].new.ends_with("_report.pdf"));
        // Verify the date part is all digits
        let date_part = &result[0].new[..8];
        assert!(date_part.chars().all(|c| c.is_ascii_digit()));
    }

    #[test]
    fn test_preview_mrt_regex_remove_prefix() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("IMG_20240101.jpg");
        fs::write(&f, "").unwrap();
        let result = preview_mrt(
            vec![f.to_string_lossy().to_string()],
            "[N]".to_string(), "[E]".to_string(), 1, 1, 1,
            Some("^IMG_".to_string()), Some("".to_string()), None,
        ).unwrap();
        assert_eq!(result[0].new, "20240101.jpg");
    }

    #[test]
    fn test_preview_mrt_regex_capture_groups() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("2024-01-15_report.txt");
        fs::write(&f, "").unwrap();
        let result = preview_mrt(
            vec![f.to_string_lossy().to_string()],
            "[N]".to_string(), "[E]".to_string(), 1, 1, 1,
            Some(r"(\d{4})-(\d{2})-(\d{2})_(.+)".to_string()),
            Some("${4}_${1}${2}${3}".to_string()),
            None,
        ).unwrap();
        assert_eq!(result[0].new, "report_20240115.txt");
    }

    #[test]
    fn test_preview_mrt_case_upper_with_spaces() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("hello world test.txt");
        fs::write(&f, "").unwrap();
        let result = preview_mrt(
            vec![f.to_string_lossy().to_string()],
            "[N]".to_string(), "[E]".to_string(), 1, 1, 1,
            None, None, Some("upper".to_string()),
        ).unwrap();
        assert_eq!(result[0].new, "HELLO WORLD TEST.txt");
    }

    #[test]
    fn test_preview_mrt_case_title_single_word() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("hello.txt");
        fs::write(&f, "").unwrap();
        let result = preview_mrt(
            vec![f.to_string_lossy().to_string()],
            "[N]".to_string(), "[E]".to_string(), 1, 1, 1,
            None, None, Some("title".to_string()),
        ).unwrap();
        assert_eq!(result[0].new, "Hello.txt");
    }

    #[test]
    fn test_preview_mrt_regex_and_counter_combined() {
        let dir = TempDir::new().unwrap();
        let f1 = dir.path().join("IMG_001.jpg");
        let f2 = dir.path().join("IMG_002.jpg");
        fs::write(&f1, "").unwrap();
        fs::write(&f2, "").unwrap();
        let result = preview_mrt(
            vec![
                f1.to_string_lossy().to_string(),
                f2.to_string_lossy().to_string(),
            ],
            "[N]_[C]".to_string(), "[E]".to_string(), 100, 1, 3,
            Some("IMG_\\d+".to_string()), Some("photo".to_string()), None,
        ).unwrap();
        assert_eq!(result[0].new, "photo_100.jpg");
        assert_eq!(result[1].new, "photo_101.jpg");
    }

    #[test]
    fn test_preview_mrt_many_files() {
        let dir = TempDir::new().unwrap();
        let mut files = Vec::new();
        for i in 0..20 {
            let f = dir.path().join(format!("file_{}.txt", i));
            fs::write(&f, "").unwrap();
            files.push(f.to_string_lossy().to_string());
        }
        let result = preview_mrt(
            files, "item_[C]".to_string(), "[E]".to_string(), 1, 1, 3, None, None, None,
        ).unwrap();
        assert_eq!(result.len(), 20);
        // All should have unique names
        let names: std::collections::HashSet<&str> = result.iter().map(|r| r.new.as_str()).collect();
        assert_eq!(names.len(), 20);
        // No errors
        assert!(result.iter().all(|r| r.status == "ok"));
    }

    #[test]
    fn test_execute_mrt_multiple_files() {
        let dir = TempDir::new().unwrap();
        let f1 = dir.path().join("old1.txt");
        let f2 = dir.path().join("old2.txt");
        let f3 = dir.path().join("old3.txt");
        fs::write(&f1, "content1").unwrap();
        fs::write(&f2, "content2").unwrap();
        fs::write(&f3, "content3").unwrap();
        execute_mrt(
            vec![
                f1.to_string_lossy().to_string(),
                f2.to_string_lossy().to_string(),
                f3.to_string_lossy().to_string(),
            ],
            "new_[C]".to_string(), "[E]".to_string(), 1, 1, 2, None, None, None,
        ).unwrap();
        assert!(!f1.exists());
        assert!(!f2.exists());
        assert!(!f3.exists());
        assert!(dir.path().join("new_01.txt").exists());
        assert!(dir.path().join("new_02.txt").exists());
        assert!(dir.path().join("new_03.txt").exists());
    }

    #[test]
    fn test_execute_mrt_with_regex() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("prefix_name.txt");
        fs::write(&f, "data").unwrap();
        execute_mrt(
            vec![f.to_string_lossy().to_string()],
            "[N]".to_string(), "[E]".to_string(), 1, 1, 1,
            Some("^prefix_".to_string()), Some("".to_string()), None,
        ).unwrap();
        assert!(!f.exists());
        assert!(dir.path().join("name.txt").exists());
        assert_eq!(fs::read_to_string(dir.path().join("name.txt")).unwrap(), "data");
    }

    #[test]
    fn test_execute_mrt_with_case_conversion() {
        let dir = TempDir::new().unwrap();
        let f = dir.path().join("oldname.txt");
        fs::write(&f, "data").unwrap();
        // Use a pattern that changes both case and name to avoid case-insensitive FS conflicts
        execute_mrt(
            vec![f.to_string_lossy().to_string()],
            "renamed_[N]".to_string(), "[E]".to_string(), 1, 1, 1,
            None, None, Some("upper".to_string()),
        ).unwrap();
        assert!(!f.exists());
        assert!(dir.path().join("RENAMED_OLDNAME.txt").exists());
        assert_eq!(fs::read_to_string(dir.path().join("RENAMED_OLDNAME.txt")).unwrap(), "data");
    }
}

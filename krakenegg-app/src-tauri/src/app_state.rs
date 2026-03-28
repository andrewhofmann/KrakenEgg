use serde::{Serialize, Deserialize};
use std::path::{Path, PathBuf};
use std::fs;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct TabStateConfig {
    pub id: String,
    pub path: String,
    pub history: Vec<String>,
    pub history_index: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PanelStateConfig {
    pub tabs: Vec<TabStateConfig>,
    pub active_tab_index: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppStateConfig {
    pub left: PanelStateConfig,
    pub right: PanelStateConfig,
    pub active_side: String, // "left" or "right"
    #[serde(default)]
    pub hotkeys: HashMap<String, String>,
    #[serde(default)]
    pub preferences: serde_json::Value,
    #[serde(default)]
    pub global_history: Vec<String>,
    #[serde(default)]
    pub hotlist: Vec<String>,
}

pub fn get_config_path(base_dir: Option<&Path>) -> Result<PathBuf, String> {
    let mut config_dir = if let Some(base) = base_dir {
        base.to_path_buf()
    } else {
        dirs::config_dir()
            .ok_or_else(|| "Could not find config directory".to_string())? 
    };
    config_dir.push("KrakenEgg");
    fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    config_dir.push("app_state.json");
    Ok(config_dir)
}

pub fn save_state_to_file(state: &AppStateConfig, config_file: &Path) -> Result<(), String> {
    let json_string = serde_json::to_string_pretty(state).map_err(|e| e.to_string())?;
    // Atomic write: write to temp file then rename to prevent corruption on crash
    let tmp_file = config_file.with_extension("json.tmp");
    fs::write(&tmp_file, &json_string).map_err(|e| e.to_string())?;
    fs::rename(&tmp_file, config_file).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load_state_from_file(config_file: &Path) -> Result<Option<AppStateConfig>, String> {
    if !config_file.exists() {
        return Ok(None);
    }
    let json_string = fs::read_to_string(config_file).map_err(|e| e.to_string())?;
    let state: AppStateConfig = serde_json::from_str(&json_string).map_err(|e| e.to_string())?;
    Ok(Some(state))
}

pub fn get_layouts_dir(base_dir: Option<&Path>) -> Result<PathBuf, String> {
    let mut config_dir = if let Some(base) = base_dir {
        base.to_path_buf()
    } else {
        dirs::config_dir()
            .ok_or_else(|| "Could not find config directory".to_string())?
    };
    config_dir.push("KrakenEgg");
    config_dir.push("layouts");
    fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    Ok(config_dir)
}

pub fn save_named_layout(name: &str, state: &AppStateConfig) -> Result<(), String> {
    // Sanitize layout name to prevent path traversal
    let safe_name = name.replace(['/', '\\', '\0'], "_").replace("..", "_");
    if safe_name.is_empty() || safe_name == "." || safe_name == ".." { return Err("Invalid layout name".to_string()); }
    let mut path = get_layouts_dir(None)?;
    path.push(format!("{}.json", safe_name));
    // Verify path stays within layouts dir
    let layouts_dir = get_layouts_dir(None)?;
    if !path.starts_with(&layouts_dir) { return Err("Invalid layout name".to_string()); }
    let json_string = serde_json::to_string_pretty(state).map_err(|e| e.to_string())?;
    fs::write(path, json_string).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load_named_layout(name: &str) -> Result<Option<AppStateConfig>, String> {
    let safe_name = name.replace(['/', '\\', '\0'], "_");
    let mut path = get_layouts_dir(None)?;
    path.push(format!("{}.json", safe_name));
    if !path.exists() {
        return Ok(None);
    }
    let json_string = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let state: AppStateConfig = serde_json::from_str(&json_string).map_err(|e| e.to_string())?;
    Ok(Some(state))
}

pub fn list_layouts() -> Result<Vec<String>, String> {
    let path = get_layouts_dir(None)?;
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
    let mut layouts = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                layouts.push(stem.to_string());
            }
        }
    }
    Ok(layouts)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::collections::HashMap;

    fn make_test_state() -> AppStateConfig {
        AppStateConfig {
            left: PanelStateConfig {
                tabs: vec![TabStateConfig {
                    id: "tab1".to_string(),
                    path: "/home".to_string(),
                    history: vec!["/home".to_string()],
                    history_index: 0,
                }],
                active_tab_index: 0,
            },
            right: PanelStateConfig {
                tabs: vec![TabStateConfig {
                    id: "tab2".to_string(),
                    path: "/tmp".to_string(),
                    history: vec!["/tmp".to_string()],
                    history_index: 0,
                }],
                active_tab_index: 0,
            },
            active_side: "left".to_string(),
            hotkeys: HashMap::new(),
            preferences: serde_json::Value::Null,
            global_history: vec![],
            hotlist: vec![],
        }
    }

    #[test]
    fn test_get_config_path_creates_directory() {
        let dir = TempDir::new().unwrap();
        let path = get_config_path(Some(dir.path())).unwrap();
        assert!(path.parent().unwrap().exists());
        assert!(path.to_string_lossy().contains("KrakenEgg"));
        assert!(path.to_string_lossy().ends_with("app_state.json"));
    }

    #[test]
    fn test_save_and_load_state_roundtrip() {
        let dir = TempDir::new().unwrap();
        let config_path = dir.path().join("state.json");
        let state = make_test_state();
        save_state_to_file(&state, &config_path).unwrap();
        let loaded = load_state_from_file(&config_path).unwrap().unwrap();
        assert_eq!(loaded.active_side, "left");
        assert_eq!(loaded.left.tabs[0].path, "/home");
        assert_eq!(loaded.right.tabs[0].path, "/tmp");
    }

    #[test]
    fn test_load_state_from_missing_file() {
        let result = load_state_from_file(Path::new("/tmp/nonexistent_krakenegg_state.json")).unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn test_get_layouts_dir_creates_directory() {
        let dir = TempDir::new().unwrap();
        let layouts_dir = get_layouts_dir(Some(dir.path())).unwrap();
        assert!(layouts_dir.exists());
        assert!(layouts_dir.to_string_lossy().contains("layouts"));
    }

    #[test]
    fn test_save_state_writes_valid_json() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("test_state.json");
        let state = make_test_state();
        save_state_to_file(&state, &path).unwrap();
        let content = fs::read_to_string(&path).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&content).unwrap();
        assert_eq!(parsed["active_side"], "left");
    }

    #[test]
    fn test_save_state_creates_file() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("new_state.json");
        assert!(!path.exists());
        let state = make_test_state();
        save_state_to_file(&state, &path).unwrap();
        assert!(path.exists());
        assert!(fs::metadata(&path).unwrap().len() > 0);
    }

    #[test]
    fn test_load_state_with_hotkeys() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("hotkeys_state.json");
        let mut state = make_test_state();
        state.hotkeys.insert("F5".to_string(), "copy".to_string());
        state.hotkeys.insert("F6".to_string(), "move".to_string());
        state.hotkeys.insert("F7".to_string(), "mkdir".to_string());
        save_state_to_file(&state, &path).unwrap();

        let loaded = load_state_from_file(&path).unwrap().unwrap();
        assert_eq!(loaded.hotkeys.len(), 3);
        assert_eq!(loaded.hotkeys.get("F5").unwrap(), "copy");
        assert_eq!(loaded.hotkeys.get("F6").unwrap(), "move");
        assert_eq!(loaded.hotkeys.get("F7").unwrap(), "mkdir");
    }

    #[test]
    fn test_load_state_with_preferences() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("prefs_state.json");
        let mut state = make_test_state();
        state.preferences = serde_json::json!({
            "theme": "dark",
            "font_size": 14,
            "show_hidden": true
        });
        save_state_to_file(&state, &path).unwrap();

        let loaded = load_state_from_file(&path).unwrap().unwrap();
        assert_eq!(loaded.preferences["theme"], "dark");
        assert_eq!(loaded.preferences["font_size"], 14);
        assert_eq!(loaded.preferences["show_hidden"], true);
    }

    #[test]
    fn test_save_load_with_global_history() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("history_state.json");
        let mut state = make_test_state();
        state.global_history = vec![
            "/home/user".to_string(),
            "/tmp".to_string(),
            "/var/log".to_string(),
        ];
        save_state_to_file(&state, &path).unwrap();

        let loaded = load_state_from_file(&path).unwrap().unwrap();
        assert_eq!(loaded.global_history.len(), 3);
        assert_eq!(loaded.global_history[0], "/home/user");
        assert_eq!(loaded.global_history[2], "/var/log");
    }

    #[test]
    fn test_save_load_with_hotlist() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("hotlist_state.json");
        let mut state = make_test_state();
        state.hotlist = vec![
            "/home/user/Documents".to_string(),
            "/home/user/Downloads".to_string(),
        ];
        save_state_to_file(&state, &path).unwrap();

        let loaded = load_state_from_file(&path).unwrap().unwrap();
        assert_eq!(loaded.hotlist.len(), 2);
        assert_eq!(loaded.hotlist[0], "/home/user/Documents");
        assert_eq!(loaded.hotlist[1], "/home/user/Downloads");
    }

    #[test]
    fn test_get_layouts_dir_creates_nested() {
        let dir = TempDir::new().unwrap();
        let layouts_dir = get_layouts_dir(Some(dir.path())).unwrap();
        assert!(layouts_dir.exists());
        assert!(layouts_dir.is_dir());
        // Should be <base>/KrakenEgg/layouts
        assert!(layouts_dir.ends_with("KrakenEgg/layouts"));
    }

    #[test]
    fn test_save_load_layout_roundtrip() {
        let dir = TempDir::new().unwrap();
        let layouts_dir = get_layouts_dir(Some(dir.path())).unwrap();

        let state = make_test_state();
        let layout_path = layouts_dir.join("my_layout.json");
        let json_string = serde_json::to_string_pretty(&state).unwrap();
        fs::write(&layout_path, &json_string).unwrap();

        // Load it back
        let loaded_json = fs::read_to_string(&layout_path).unwrap();
        let loaded: AppStateConfig = serde_json::from_str(&loaded_json).unwrap();
        assert_eq!(loaded.active_side, "left");
        assert_eq!(loaded.left.tabs[0].path, "/home");
        assert_eq!(loaded.right.tabs[0].path, "/tmp");
    }

    #[test]
    fn test_list_layouts_with_multiple() {
        let dir = TempDir::new().unwrap();
        let layouts_dir = get_layouts_dir(Some(dir.path())).unwrap();

        let state = make_test_state();
        for name in &["work", "personal", "dev"] {
            let path = layouts_dir.join(format!("{}.json", name));
            let json = serde_json::to_string_pretty(&state).unwrap();
            fs::write(path, json).unwrap();
        }

        let entries = fs::read_dir(&layouts_dir).unwrap();
        let mut names: Vec<String> = entries
            .filter_map(|e| e.ok())
            .filter_map(|e| {
                let p = e.path();
                if p.extension().and_then(|s| s.to_str()) == Some("json") {
                    p.file_stem().and_then(|s| s.to_str()).map(|s| s.to_string())
                } else {
                    None
                }
            })
            .collect();
        names.sort();
        assert_eq!(names, vec!["dev", "personal", "work"]);
    }

    #[test]
    fn test_list_layouts_empty_dir() {
        let dir = TempDir::new().unwrap();
        let layouts_dir = get_layouts_dir(Some(dir.path())).unwrap();
        let entries = fs::read_dir(&layouts_dir).unwrap();
        let count = entries.count();
        assert_eq!(count, 0);
    }

    #[test]
    fn test_load_nonexistent_layout_returns_none() {
        let dir = TempDir::new().unwrap();
        let layouts_dir = get_layouts_dir(Some(dir.path())).unwrap();
        let path = layouts_dir.join("nonexistent.json");
        assert!(!path.exists());
        // Loading from a nonexistent path should yield None
        let result = load_state_from_file(&path).unwrap();
        assert!(result.is_none());
    }
}

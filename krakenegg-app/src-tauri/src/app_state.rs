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
    fs::write(config_file, json_string).map_err(|e| e.to_string())?;
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
    let mut path = get_layouts_dir(None)?;
    path.push(format!("{}.json", name));
    let json_string = serde_json::to_string_pretty(state).map_err(|e| e.to_string())?;
    fs::write(path, json_string).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load_named_layout(name: &str) -> Result<Option<AppStateConfig>, String> {
    let mut path = get_layouts_dir(None)?;
    path.push(format!("{}.json", name));
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

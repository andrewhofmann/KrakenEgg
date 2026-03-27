use serde::Serialize;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::sync::atomic::AtomicBool;
use std::sync::mpsc::Sender;

#[derive(Serialize, Debug, Clone)]
pub struct FileInfo {
    pub name: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified_at: Option<u64>,
    pub created_at: Option<u64>,
    pub permissions: Option<u32>, // Unix permission bits
    pub extension: Option<String>, // Lowercase file extension (e.g., "txt", "rs")
    pub is_symlink: bool,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum ConflictResolution {
    Overwrite,
    Skip,
    OverwriteAll,
    SkipAll,
    Cancel
}

pub struct OperationContext {
    pub cancel: Arc<AtomicBool>,
    pub resolution_tx: Option<Sender<ConflictResolution>>, // Sender for conflict resolution
}

pub struct OperationMap(pub Arc<Mutex<HashMap<String, OperationContext>>>);

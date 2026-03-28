use crate::types::*;
use crate::error::{AppError, Result};
use std::path::{Path, PathBuf};
use std::fs;
use walkdir::WalkDir;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use tokio::{task, fs as tokio_fs};
use lru::LruCache;
use once_cell::sync::Lazy;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use std::collections::HashMap;
use std::num::NonZero;

// Performance constants
const CACHE_SIZE: usize = 1000;
const CACHE_TTL_SECS: u64 = 30;
const PARALLEL_CHUNK_SIZE: usize = 50;
const MAX_CONCURRENT_TASKS: usize = 20;

// Global cache for directory listings
static DIRECTORY_CACHE: Lazy<Arc<Mutex<LruCache<String, CachedListing>>>> =
    Lazy::new(|| Arc::new(Mutex::new(LruCache::new(NonZero::new(CACHE_SIZE).unwrap()))));

#[derive(Clone, Debug)]
struct CachedListing {
    listing: DirectoryListing,
    timestamp: Instant,
}

#[derive(Debug, Clone)]
pub enum MetadataLevel {
    Light,    // Only name, size, is_directory
    Standard, // Add timestamps and permissions
    Detailed, // Full metadata including MIME types
}

impl CachedListing {
    fn is_expired(&self) -> bool {
        self.timestamp.elapsed() > Duration::from_secs(CACHE_TTL_SECS)
    }
}

// Security: Path validation and sanitization functions
fn validate_and_canonicalize_path(input_path: &str) -> Result<PathBuf> {
    // Prevent empty or null paths
    if input_path.is_empty() {
        return Err(AppError::InvalidPath("Path cannot be empty".to_string()));
    }

    // Convert to Path and canonicalize to resolve any symbolic links and normalize
    let path = Path::new(input_path);

    // Attempt to canonicalize the path
    let canonical_path = path.canonicalize()
        .map_err(|e| AppError::InvalidPath(format!("Cannot resolve path '{}': {}", input_path, e)))?;

    // Check for directory traversal attempts by examining path components
    for component in canonical_path.components() {
        if let std::path::Component::ParentDir = component {
            return Err(AppError::InvalidPath(
                "Path traversal attempt detected: Parent directory access not allowed".to_string()
            ));
        }
    }

    // Additional security check: ensure the canonical path is absolute
    if !canonical_path.is_absolute() {
        return Err(AppError::InvalidPath(
            "Relative paths are not allowed for security reasons".to_string()
        ));
    }

    // Log the path validation for security auditing
    println!("PATH_VALIDATION: Input '{}' -> Canonical '{}'", input_path, canonical_path.display());

    Ok(canonical_path)
}

fn validate_path_for_creation(input_path: &str) -> Result<PathBuf> {
    // For path creation, we need to validate the parent directory exists and is valid
    if input_path.is_empty() {
        return Err(AppError::InvalidPath("Path cannot be empty".to_string()));
    }

    let path = Path::new(input_path);

    // Check if the path already exists - if so, validate it normally
    if path.exists() {
        return validate_and_canonicalize_path(input_path);
    }

    // If the path doesn't exist, validate the parent directory
    if let Some(parent) = path.parent() {
        if parent.exists() {
            let canonical_parent = validate_and_canonicalize_path(parent.to_str().unwrap_or(""))?;

            // Construct the new path with validated parent
            let file_name = path.file_name()
                .ok_or_else(|| AppError::InvalidPath("Invalid file name".to_string()))?;

            let new_path = canonical_parent.join(file_name);

            // Security check: ensure no path traversal in the filename
            if file_name.to_str().unwrap_or("").contains("..") {
                return Err(AppError::InvalidPath(
                    "Path traversal attempt in filename detected".to_string()
                ));
            }

            println!("PATH_CREATION_VALIDATION: Input '{}' -> Target '{}'", input_path, new_path.display());
            return Ok(new_path);
        } else {
            return Err(AppError::InvalidPath(
                format!("Parent directory does not exist: {}", parent.display())
            ));
        }
    }

    Err(AppError::InvalidPath("Invalid path structure".to_string()))
}

// ============================================================================
// HIGH-PERFORMANCE DIRECTORY LISTING
// ============================================================================

pub async fn list_directory_contents(path: &str) -> Result<DirectoryListing> {
    list_directory_contents_with_level(path, MetadataLevel::Standard).await
}

pub async fn list_directory_contents_fast(path: &str) -> Result<DirectoryListing> {
    list_directory_contents_with_level(path, MetadataLevel::Light).await
}

pub async fn list_directory_contents_detailed(path: &str) -> Result<DirectoryListing> {
    list_directory_contents_with_level(path, MetadataLevel::Detailed).await
}

pub async fn list_directory_contents_with_level(path: &str, level: MetadataLevel) -> Result<DirectoryListing> {
    let start_time = Instant::now();

    // Security: Validate and canonicalize the path to prevent directory traversal
    let validated_path = validate_and_canonicalize_path(path)?;
    let canonical_path_str = validated_path.display().to_string();

    // Check cache first (only for Standard level to maintain consistency)
    if matches!(level, MetadataLevel::Standard) {
        if let Some(cached) = get_cached_listing(&canonical_path_str) {
            println!("CACHE_HIT: Retrieved '{}' from cache", canonical_path_str);
            return Ok(cached.listing);
        }
    }

    if !validated_path.is_dir() {
        return Err(AppError::InvalidPath(format!("Path is not a directory: {}", validated_path.display())));
    }

    println!("LIST_DIR_FAST: Starting high-performance listing for '{}'", canonical_path_str);

    // Read directory entries
    let mut entries = Vec::new();
    let mut read_dir = tokio_fs::read_dir(&validated_path).await?;

    while let Some(entry) = read_dir.next_entry().await? {
        entries.push(Ok(entry));
    }

    let entry_count = entries.len();
    println!("LIST_DIR_FAST: Found {} entries, processing in parallel", entry_count);

    // Process entries in parallel chunks
    let mut files = if entry_count > PARALLEL_CHUNK_SIZE {
        process_entries_parallel(entries, &level).await?
    } else {
        process_entries_sequential(entries, &level).await?
    };

    // Add parent directory entry if not root
    if validated_path.parent().is_some() {
        let parent_path = validated_path.parent().unwrap();
        let parent_dir_info = FileInfo {
            id: "..".to_string(),
            name: "..".to_string(),
            path: parent_path.to_string_lossy().to_string(),
            size: 0,
            is_directory: true,
            is_hidden: false,
            is_symlink: false,
            created: Utc::now(),
            modified: Utc::now(),
            accessed: Utc::now(),
            permissions: FilePermissions {
                readable: true,
                writable: false,
                executable: true,
                mode: 0o755,
            },
            extension: None,
            mime_type: None,
        };
        files.insert(0, parent_dir_info);
    }

    // Fast sorting with pre-computed lowercase names (keep .. at top)
    files.sort_by(|a, b| {
        // Always keep ".." at the top
        if a.name == ".." {
            return std::cmp::Ordering::Less;
        }
        if b.name == ".." {
            return std::cmp::Ordering::Greater;
        }

        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    // Calculate totals
    let (file_count, directory_count, total_size) = files.iter().fold(
        (0, 0, 0),
        |(files, dirs, size), file| {
            if file.is_directory {
                (files, dirs + 1, size)
            } else {
                (files + 1, dirs, size + file.size)
            }
        },
    );

    let listing = DirectoryListing {
        path: canonical_path_str.clone(),
        files,
        total_size,
        file_count,
        directory_count,
    };

    // Cache the result (only for Standard level)
    if matches!(level, MetadataLevel::Standard) {
        cache_listing(canonical_path_str.clone(), listing.clone());
    }

    let elapsed = start_time.elapsed();
    println!(
        "LIST_DIR_FAST: Completed '{}' in {}ms - {} files, {} dirs",
        canonical_path_str,
        elapsed.as_millis(),
        file_count,
        directory_count
    );

    Ok(listing)
}

// High-performance parallel processing for large directories
async fn process_entries_parallel(
    entries: Vec<std::io::Result<tokio::fs::DirEntry>>,
    level: &MetadataLevel,
) -> Result<Vec<FileInfo>> {
    let semaphore = Arc::new(tokio::sync::Semaphore::new(MAX_CONCURRENT_TASKS));

    // Convert to paths first to avoid clone issues with DirEntry
    let mut paths = Vec::new();
    for entry_result in entries {
        match entry_result {
            Ok(entry) => paths.push(entry.path()),
            Err(e) => return Err(AppError::from(e)),
        }
    }

    let chunks: Vec<_> = paths.chunks(PARALLEL_CHUNK_SIZE).collect();
    let mut tasks = Vec::new();

    for chunk in chunks {
        let chunk_paths: Vec<_> = chunk.to_vec();
        let level = level.clone();
        let semaphore = semaphore.clone();

        let task = task::spawn(async move {
            let _permit = semaphore.acquire().await.map_err(|_| AppError::Unknown("Failed to acquire semaphore".to_string()))?;
            process_path_chunk(chunk_paths, &level).await
        });

        tasks.push(task);
    }

    let mut all_files = Vec::new();
    for task in tasks {
        let chunk_files = task.await??;
        all_files.extend(chunk_files);
    }

    Ok(all_files)
}

// Sequential processing for smaller directories
async fn process_entries_sequential(
    entries: Vec<std::io::Result<tokio::fs::DirEntry>>,
    level: &MetadataLevel,
) -> Result<Vec<FileInfo>> {
    // Convert to paths first
    let mut paths = Vec::new();
    for entry_result in entries {
        match entry_result {
            Ok(entry) => paths.push(entry.path()),
            Err(e) => return Err(AppError::from(e)),
        }
    }
    process_path_chunk(paths, level).await
}

// Process a chunk of paths
async fn process_path_chunk(
    paths: Vec<PathBuf>,
    level: &MetadataLevel,
) -> Result<Vec<FileInfo>> {
    let mut files = Vec::new();

    for path in paths {
        // Get metadata asynchronously
        let metadata = match tokio_fs::metadata(&path).await {
            Ok(meta) => meta,
            Err(e) => {
                eprintln!("Failed to get metadata for {}: {}", path.display(), e);
                continue; // Skip files with metadata errors
            }
        };

        let file_info = create_file_info_with_level(&path, &metadata, level)?;
        files.push(file_info);
    }

    Ok(files)
}

// Optimized file info creation with different detail levels
fn create_file_info_with_level(path: &Path, metadata: &std::fs::Metadata, level: &MetadataLevel) -> Result<FileInfo> {
    let name = path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();

    let extension = path.extension()
        .and_then(|ext| ext.to_str())
        .map(|s| s.to_string());

    let is_hidden = name.starts_with('.');
    let is_symlink = metadata.file_type().is_symlink();
    let is_directory = metadata.is_dir();
    let size = metadata.len();

    // Optimize based on metadata level
    let (created, modified, accessed, permissions, mime_type) = match level {
        MetadataLevel::Light => {
            // Minimal metadata for fast listing
            let now = Utc::now();
            let basic_permissions = FilePermissions {
                readable: true,
                writable: !metadata.permissions().readonly(),
                executable: false,
                mode: 0,
            };
            (now, now, now, basic_permissions, None)
        }
        MetadataLevel::Standard => {
            // Standard metadata with timestamps and permissions
            let created = metadata.created()
                .map(|t| DateTime::from(t))
                .unwrap_or_else(|_| Utc::now());
            let modified = metadata.modified()
                .map(|t| DateTime::from(t))
                .unwrap_or_else(|_| Utc::now());
            let accessed = metadata.accessed()
                .map(|t| DateTime::from(t))
                .unwrap_or_else(|_| Utc::now());
            let permissions = get_file_permissions(metadata);
            (created, modified, accessed, permissions, None)
        }
        MetadataLevel::Detailed => {
            // Full metadata including MIME types
            let created = metadata.created()
                .map(|t| DateTime::from(t))
                .unwrap_or_else(|_| Utc::now());
            let modified = metadata.modified()
                .map(|t| DateTime::from(t))
                .unwrap_or_else(|_| Utc::now());
            let accessed = metadata.accessed()
                .map(|t| DateTime::from(t))
                .unwrap_or_else(|_| Utc::now());
            let permissions = get_file_permissions(metadata);
            let mime_type = get_mime_type(&extension);
            (created, modified, accessed, permissions, mime_type)
        }
    };

    Ok(FileInfo {
        id: generate_fast_id(&name, size, is_directory), // Faster ID generation
        name,
        path: path.display().to_string(),
        size,
        is_directory,
        is_hidden,
        is_symlink,
        created,
        modified,
        accessed,
        permissions,
        extension,
        mime_type,
    })
}

// Fast ID generation without UUID for better performance
fn generate_fast_id(name: &str, size: u64, is_directory: bool) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    name.hash(&mut hasher);
    size.hash(&mut hasher);
    is_directory.hash(&mut hasher);

    format!("{:x}", hasher.finish())
}

// Cache management functions
fn get_cached_listing(path: &str) -> Option<CachedListing> {
    let mut cache = DIRECTORY_CACHE.lock().unwrap();

    if let Some(cached) = cache.get(path) {
        if !cached.is_expired() {
            return Some(cached.clone());
        } else {
            cache.pop(path); // Remove expired entry
        }
    }

    None
}

fn cache_listing(path: String, listing: DirectoryListing) {
    let mut cache = DIRECTORY_CACHE.lock().unwrap();

    let cached = CachedListing {
        listing,
        timestamp: Instant::now(),
    };

    cache.put(path, cached);
}

// Cache invalidation for file operations
pub fn invalidate_directory_cache(path: &str) {
    let mut cache = DIRECTORY_CACHE.lock().unwrap();

    // Remove exact path
    cache.pop(path);

    // Remove parent directory cache as well
    if let Some(parent) = Path::new(path).parent() {
        cache.pop(&parent.display().to_string());
    }

    println!("CACHE_INVALIDATE: Cleared cache for '{}'", path);
}

// Legacy function for compatibility
fn create_file_info(path: &Path, metadata: &fs::Metadata) -> Result<FileInfo> {
    create_file_info_with_level(path, metadata, &MetadataLevel::Standard)
}

// ============================================================================
// EXISTING FUNCTIONS (with cache invalidation added)
// ============================================================================

pub async fn get_file_information(path: &str) -> Result<FileInfo> {
    // Security: Validate and canonicalize the path to prevent directory traversal
    let validated_path = validate_and_canonicalize_path(path)?;

    if !validated_path.exists() {
        return Err(AppError::NotFound(format!("File not found: {}", validated_path.display())));
    }

    let metadata = fs::metadata(&validated_path)?;
    create_file_info(&validated_path, &metadata)
}

fn get_file_permissions(metadata: &fs::Metadata) -> FilePermissions {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mode = metadata.permissions().mode();

        FilePermissions {
            readable: mode & 0o400 != 0,
            writable: mode & 0o200 != 0,
            executable: mode & 0o100 != 0,
            mode,
        }
    }

    #[cfg(not(unix))]
    {
        let permissions = metadata.permissions();

        FilePermissions {
            readable: !permissions.readonly(),
            writable: !permissions.readonly(),
            executable: false, // Windows doesn't have executable bit
            mode: 0,
        }
    }
}

fn get_mime_type(extension: &Option<String>) -> Option<String> {
    match extension.as_ref().map(|s| s.as_str()) {
        Some("txt") => Some("text/plain".to_string()),
        Some("html") | Some("htm") => Some("text/html".to_string()),
        Some("css") => Some("text/css".to_string()),
        Some("js") => Some("text/javascript".to_string()),
        Some("json") => Some("application/json".to_string()),
        Some("xml") => Some("application/xml".to_string()),
        Some("pdf") => Some("application/pdf".to_string()),
        Some("zip") => Some("application/zip".to_string()),
        Some("tar") => Some("application/x-tar".to_string()),
        Some("gz") => Some("application/gzip".to_string()),
        Some("jpg") | Some("jpeg") => Some("image/jpeg".to_string()),
        Some("png") => Some("image/png".to_string()),
        Some("gif") => Some("image/gif".to_string()),
        Some("svg") => Some("image/svg+xml".to_string()),
        Some("mp3") => Some("audio/mpeg".to_string()),
        Some("mp4") => Some("video/mp4".to_string()),
        Some("avi") => Some("video/x-msvideo".to_string()),
        _ => None,
    }
}

pub async fn create_directory_at_path(path: &str) -> Result<()> {
    // Security: Validate path for creation (handles non-existent paths)
    let validated_path = validate_path_for_creation(path)?;

    if validated_path.exists() {
        return Err(AppError::Io(format!("Directory already exists: {}", validated_path.display())));
    }

    fs::create_dir_all(&validated_path)?;

    // Invalidate parent directory cache
    if let Some(parent) = validated_path.parent() {
        invalidate_directory_cache(&parent.display().to_string());
    }

    println!("CREATE_DIR: Successfully created directory at '{}'", validated_path.display());
    Ok(())
}

pub async fn rename_file_or_directory(old_path: &str, new_path: &str) -> Result<()> {
    // Security: Validate both source and destination paths
    let validated_old_path = validate_and_canonicalize_path(old_path)?;
    let validated_new_path = validate_path_for_creation(new_path)?;

    if !validated_old_path.exists() {
        return Err(AppError::NotFound(format!("Source not found: {}", validated_old_path.display())));
    }

    if validated_new_path.exists() {
        return Err(AppError::Io(format!("Destination already exists: {}", validated_new_path.display())));
    }

    fs::rename(&validated_old_path, &validated_new_path)?;

    // Invalidate caches for both old and new parent directories
    if let Some(old_parent) = validated_old_path.parent() {
        invalidate_directory_cache(&old_parent.display().to_string());
    }
    if let Some(new_parent) = validated_new_path.parent() {
        invalidate_directory_cache(&new_parent.display().to_string());
    }

    println!("RENAME: Successfully renamed '{}' to '{}'", validated_old_path.display(), validated_new_path.display());
    Ok(())
}

pub async fn delete_file_or_directory(path: &str) -> Result<()> {
    // Security: Validate path before deletion
    let validated_path = validate_and_canonicalize_path(path)?;

    if !validated_path.exists() {
        return Err(AppError::NotFound(format!("Path not found: {}", validated_path.display())));
    }

    // Invalidate cache before deletion
    if let Some(parent) = validated_path.parent() {
        invalidate_directory_cache(&parent.display().to_string());
    }
    if validated_path.is_dir() {
        invalidate_directory_cache(&validated_path.display().to_string());
    }

    if validated_path.is_dir() {
        fs::remove_dir_all(&validated_path)?;
        println!("DELETE: Successfully removed directory '{}'", validated_path.display());
    } else {
        fs::remove_file(&validated_path)?;
        println!("DELETE: Successfully removed file '{}'", validated_path.display());
    }

    Ok(())
}

pub async fn copy_file_or_directory(source: &str, destination: &str) -> Result<()> {
    // Security: Validate both source and destination paths
    let validated_source = validate_and_canonicalize_path(source)?;
    let validated_destination = validate_path_for_creation(destination)?;

    if !validated_source.exists() {
        return Err(AppError::NotFound(format!("Source not found: {}", validated_source.display())));
    }

    if validated_source.is_dir() {
        copy_directory_recursive(&validated_source, &validated_destination)?;
        println!("COPY: Successfully copied directory '{}' to '{}'", validated_source.display(), validated_destination.display());
    } else {
        if let Some(parent) = validated_destination.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::copy(&validated_source, &validated_destination)?;
        println!("COPY: Successfully copied file '{}' to '{}'", validated_source.display(), validated_destination.display());
    }

    // Invalidate destination parent directory cache
    if let Some(dest_parent) = validated_destination.parent() {
        invalidate_directory_cache(&dest_parent.display().to_string());
    }

    Ok(())
}

pub async fn move_file_or_directory(source: &str, destination: &str) -> Result<()> {
    copy_file_or_directory(source, destination).await?;
    delete_file_or_directory(source).await?;
    Ok(())
}

fn copy_directory_recursive(source: &Path, destination: &Path) -> Result<()> {
    fs::create_dir_all(destination)?;

    for entry in WalkDir::new(source) {
        let entry = entry.map_err(|e| AppError::Io(e.to_string()))?;
        let path = entry.path();

        let relative_path = path.strip_prefix(source)
            .map_err(|e| AppError::Io(e.to_string()))?;
        let dest_path = destination.join(relative_path);

        if path.is_dir() {
            fs::create_dir_all(&dest_path)?;
        } else {
            if let Some(parent) = dest_path.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::copy(path, &dest_path)?;
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::{TempDir, NamedTempFile};
    use std::fs::{self, File};
    use std::io::Write;

    #[tokio::test]
    async fn test_list_directory_contents() {
        // Create a temporary directory with some test files
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let temp_path = temp_dir.path().to_str().unwrap();

        // Create test files
        let test_file = temp_dir.path().join("test.txt");
        let mut file = File::create(&test_file).expect("Failed to create test file");
        writeln!(file, "Hello, world!").expect("Failed to write to test file");

        // Create a subdirectory
        let subdir = temp_dir.path().join("subdir");
        fs::create_dir(&subdir).expect("Failed to create subdirectory");

        // Test listing directory contents
        let result = list_directory_contents(temp_path).await;
        assert!(result.is_ok());

        let listing = result.unwrap();
        assert_eq!(listing.path, temp_path);
        assert_eq!(listing.files.len(), 2); // test.txt and subdir
        assert_eq!(listing.file_count, 1);
        assert_eq!(listing.directory_count, 1);

        // Check that files are sorted correctly (directories first)
        let first_file = &listing.files[0];
        assert!(first_file.is_directory);
        assert_eq!(first_file.name, "subdir");
    }

    #[tokio::test]
    async fn test_performance_levels() {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let temp_path = temp_dir.path().to_str().unwrap();

        // Create multiple test files
        for i in 0..10 {
            let test_file = temp_dir.path().join(format!("test_{}.txt", i));
            let mut file = File::create(&test_file).expect("Failed to create test file");
            writeln!(file, "Test file {}", i).expect("Failed to write to test file");
        }

        // Test light level (fastest)
        let light_result = list_directory_contents_with_level(temp_path, MetadataLevel::Light).await;
        assert!(light_result.is_ok());

        // Test standard level (cached)
        let standard_result = list_directory_contents_with_level(temp_path, MetadataLevel::Standard).await;
        assert!(standard_result.is_ok());

        // Test detailed level (most complete)
        let detailed_result = list_directory_contents_with_level(temp_path, MetadataLevel::Detailed).await;
        assert!(detailed_result.is_ok());

        let detailed_listing = detailed_result.unwrap();
        assert_eq!(detailed_listing.files.len(), 10);
    }

    #[tokio::test]
    async fn test_cache_functionality() {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let temp_path = temp_dir.path().to_str().unwrap();

        // Create a test file
        let test_file = temp_dir.path().join("cache_test.txt");
        let mut file = File::create(&test_file).expect("Failed to create test file");
        writeln!(file, "Cache test").expect("Failed to write to test file");

        // First call should not hit cache
        let start = Instant::now();
        let result1 = list_directory_contents(temp_path).await;
        let first_duration = start.elapsed();
        assert!(result1.is_ok());

        // Second call should hit cache and be faster
        let start = Instant::now();
        let result2 = list_directory_contents(temp_path).await;
        let second_duration = start.elapsed();
        assert!(result2.is_ok());

        // Cache hit should be significantly faster
        assert!(second_duration < first_duration);
    }

    #[tokio::test]
    async fn test_get_file_information() {
        let temp_file = NamedTempFile::new().expect("Failed to create temp file");
        let temp_path = temp_file.path().to_str().unwrap();

        let result = get_file_information(temp_path).await;
        assert!(result.is_ok());

        let file_info = result.unwrap();
        assert_eq!(file_info.path, temp_path);
        assert!(!file_info.is_directory);
        assert!(!file_info.name.is_empty());
    }

    #[tokio::test]
    async fn test_create_directory() {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let new_dir_path = temp_dir.path().join("new_directory");
        let new_dir_str = new_dir_path.to_str().unwrap();

        // Test creating directory
        let result = create_directory_at_path(new_dir_str).await;
        assert!(result.is_ok());

        // Verify directory was created
        assert!(new_dir_path.exists());
        assert!(new_dir_path.is_dir());
    }

    #[tokio::test]
    async fn test_copy_file() {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");

        // Create source file
        let source_path = temp_dir.path().join("source.txt");
        let mut source_file = File::create(&source_path).expect("Failed to create source file");
        writeln!(source_file, "Test content").expect("Failed to write to source file");

        // Define destination path
        let dest_path = temp_dir.path().join("destination.txt");

        let source_str = source_path.to_str().unwrap();
        let dest_str = dest_path.to_str().unwrap();

        // Test copying file
        let result = copy_file_or_directory(source_str, dest_str).await;
        assert!(result.is_ok());

        // Verify file was copied
        assert!(dest_path.exists());
        let content = fs::read_to_string(&dest_path).expect("Failed to read destination file");
        assert!(content.contains("Test content"));
    }
}
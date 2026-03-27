use crate::types::*;
use crate::error::{AppError, Result};
use std::path::Path;
use std::fs;
use walkdir::WalkDir;
use chrono::{DateTime, Utc};
use uuid::Uuid;

pub async fn list_directory_contents(path: &str) -> Result<DirectoryListing> {
    let path = Path::new(path);

    if !path.exists() {
        return Err(AppError::NotFound(format!("Directory not found: {}", path.display())));
    }

    if !path.is_dir() {
        return Err(AppError::InvalidPath(format!("Path is not a directory: {}", path.display())));
    }

    let mut files = Vec::new();
    let mut total_size = 0u64;
    let mut file_count = 0usize;
    let mut directory_count = 0usize;

    let entries = fs::read_dir(path)?;

    for entry in entries {
        let entry = entry?;
        let metadata = entry.metadata()?;
        let file_path = entry.path();

        let file_info = create_file_info(&file_path, &metadata)?;

        if file_info.is_directory {
            directory_count += 1;
        } else {
            file_count += 1;
            total_size += file_info.size;
        }

        files.push(file_info);
    }

    // Sort files: directories first, then by name
    files.sort_by(|a, b| {
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(DirectoryListing {
        path: path.display().to_string(),
        files,
        total_size,
        file_count,
        directory_count,
    })
}

pub async fn get_file_information(path: &str) -> Result<FileInfo> {
    let path = Path::new(path);

    if !path.exists() {
        return Err(AppError::NotFound(format!("File not found: {}", path.display())));
    }

    let metadata = fs::metadata(path)?;
    create_file_info(path, &metadata)
}

fn create_file_info(path: &Path, metadata: &fs::Metadata) -> Result<FileInfo> {
    let name = path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();

    let extension = path.extension()
        .and_then(|ext| ext.to_str())
        .map(|s| s.to_string());

    let is_hidden = name.starts_with('.');
    let is_symlink = metadata.file_type().is_symlink();

    // Convert system time to DateTime<Utc>
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

    Ok(FileInfo {
        id: Uuid::new_v4().to_string(),
        name,
        path: path.display().to_string(),
        size: metadata.len(),
        is_directory: metadata.is_dir(),
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
    let path = Path::new(path);

    if path.exists() {
        return Err(AppError::Io(format!("Directory already exists: {}", path.display())));
    }

    fs::create_dir_all(path)?;
    Ok(())
}

pub async fn rename_file_or_directory(old_path: &str, new_path: &str) -> Result<()> {
    let old_path = Path::new(old_path);
    let new_path = Path::new(new_path);

    if !old_path.exists() {
        return Err(AppError::NotFound(format!("Source not found: {}", old_path.display())));
    }

    if new_path.exists() {
        return Err(AppError::Io(format!("Destination already exists: {}", new_path.display())));
    }

    fs::rename(old_path, new_path)?;
    Ok(())
}

pub async fn delete_file_or_directory(path: &str) -> Result<()> {
    let path = Path::new(path);

    if !path.exists() {
        return Err(AppError::NotFound(format!("Path not found: {}", path.display())));
    }

    if path.is_dir() {
        fs::remove_dir_all(path)?;
    } else {
        fs::remove_file(path)?;
    }

    Ok(())
}

pub async fn copy_file_or_directory(source: &str, destination: &str) -> Result<()> {
    let source = Path::new(source);
    let destination = Path::new(destination);

    if !source.exists() {
        return Err(AppError::NotFound(format!("Source not found: {}", source.display())));
    }

    if source.is_dir() {
        copy_directory_recursive(source, destination)?;
    } else {
        if let Some(parent) = destination.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::copy(source, destination)?;
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
use crate::file_system;
use crate::types::*;
use crate::error::Result;
use tauri::command;
use std::env;
use std::fs;

// File System Commands
#[command]
pub async fn list_directory(path: String) -> Result<DirectoryListing> {
    println!("LIST_DIR: Request for path '{}'", path);
    let result = file_system::list_directory_contents(&path).await;
    match &result {
        Ok(listing) => println!("LIST_DIR: Success for '{}' - {} files, {} dirs", path, listing.file_count, listing.directory_count),
        Err(e) => eprintln!("LIST_DIR: Failed for '{}': {}", path, e),
    }
    result
}

#[command]
pub async fn list_directory_fast(path: String) -> Result<DirectoryListing> {
    println!("LIST_DIR_FAST: Request for fast listing of path '{}'", path);
    let result = file_system::list_directory_contents_fast(&path).await;
    match &result {
        Ok(listing) => println!("LIST_DIR_FAST: Success for '{}' - {} files, {} dirs", path, listing.file_count, listing.directory_count),
        Err(e) => eprintln!("LIST_DIR_FAST: Failed for '{}': {}", path, e),
    }
    result
}

#[command]
pub async fn list_directory_detailed(path: String) -> Result<DirectoryListing> {
    println!("LIST_DIR_DETAILED: Request for detailed listing of path '{}'", path);
    let result = file_system::list_directory_contents_detailed(&path).await;
    match &result {
        Ok(listing) => println!("LIST_DIR_DETAILED: Success for '{}' - {} files, {} dirs", path, listing.file_count, listing.directory_count),
        Err(e) => eprintln!("LIST_DIR_DETAILED: Failed for '{}': {}", path, e),
    }
    result
}

#[command]
pub async fn navigate_to_path(path: String) -> Result<DirectoryListing> {
    println!("NAVIGATE: Request to path '{}'", path);

    let expanded_path = if path.starts_with('~') {
        if let Some(home) = dirs::home_dir() {
            let expanded = path.replace('~', home.to_str().unwrap_or(""));
            println!("NAVIGATE: Expanded '{}' to '{}'", path, expanded);
            expanded
        } else {
            eprintln!("NAVIGATE: Could not find home directory for '{}'", path);
            path
        }
    } else {
        path
    };

    let result = file_system::list_directory_contents(&expanded_path).await;

    match &result {
        Ok(listing) => {
            println!("NAVIGATE: Success to '{}' - {} files, {} dirs",
                  expanded_path, listing.file_count, listing.directory_count);
        },
        Err(e) => {
            eprintln!("NAVIGATE: Failed to '{}: {}", expanded_path, e);
        }
    }

    result
}

#[command]
pub async fn get_file_info(path: String) -> Result<FileInfo> {
    file_system::get_file_information(&path).await
}

#[command]
pub async fn create_directory(path: String) -> Result<()> {
    file_system::create_directory_at_path(&path).await
}

#[command]
pub async fn rename_file(old_path: String, new_path: String) -> Result<()> {
    file_system::rename_file_or_directory(&old_path, &new_path).await
}

#[command]
pub async fn delete_file(path: String) -> Result<()> {
    file_system::delete_file_or_directory(&path).await
}

#[command]
pub async fn copy_file(source: String, destination: String) -> Result<()> {
    file_system::copy_file_or_directory(&source, &destination).await
}

#[command]
pub async fn move_file(source: String, destination: String) -> Result<()> {
    file_system::move_file_or_directory(&source, &destination).await
}

#[command]
pub async fn write_file(path: String, content: String) -> Result<()> {
    println!("WRITE_FILE: Writing to '{}'", path);
    match fs::write(&path, content) {
        Ok(_) => {
            println!("WRITE_FILE: Success for '{}'", path);
            Ok(())
        },
        Err(e) => {
            eprintln!("WRITE_FILE: Failed for '{}': {}", path, e);
            Err(crate::error::AppError::Io(e.to_string()))
        }
    }
}

#[command]
pub async fn read_file(path: String) -> Result<String> {
    println!("READ_FILE: Reading from '{}'", path);
    match fs::read_to_string(&path) {
        Ok(content) => {
            println!("READ_FILE: Success for '{}' - {} bytes", path, content.len());
            Ok(content)
        },
        Err(e) => {
            eprintln!("READ_FILE: Failed for '{}': {}", path, e);
            Err(crate::error::AppError::Io(e.to_string()))
        }
    }
}

#[command]
pub async fn delete_directory(path: String, recursive: bool) -> Result<()> {
    println!("DELETE_DIR: Deleting '{}' (recursive: {})", path, recursive);
    if recursive {
        match fs::remove_dir_all(&path) {
            Ok(_) => {
                println!("DELETE_DIR: Success (recursive) for '{}'", path);
                Ok(())
            },
            Err(e) => {
                eprintln!("DELETE_DIR: Failed (recursive) for '{}': {}", path, e);
                Err(crate::error::AppError::Io(e.to_string()))
            }
        }
    } else {
        match fs::remove_dir(&path) {
            Ok(_) => {
                println!("DELETE_DIR: Success for '{}'", path);
                Ok(())
            },
            Err(e) => {
                eprintln!("DELETE_DIR: Failed for '{}': {}", path, e);
                Err(crate::error::AppError::Io(e.to_string()))
            }
        }
    }
}

#[command]
pub async fn path_exists(path: String) -> Result<bool> {
    println!("PATH_EXISTS: Checking '{}'", path);
    let exists = std::path::Path::new(&path).exists();
    println!("PATH_EXISTS: '{}' exists: {}", path, exists);
    Ok(exists)
}

#[command]
pub async fn get_file_size(path: String) -> Result<u64> {
    println!("FILE_SIZE: Getting size for '{}'", path);
    match fs::metadata(&path) {
        Ok(metadata) => {
            let size = metadata.len();
            println!("FILE_SIZE: '{}' is {} bytes", path, size);
            Ok(size)
        },
        Err(e) => {
            eprintln!("FILE_SIZE: Failed for '{}': {}", path, e);
            Err(crate::error::AppError::Io(e.to_string()))
        }
    }
}

#[command]
pub async fn set_file_permissions(path: String, permissions: u32) -> Result<()> {
    println!("SET_PERMS: Setting permissions for '{}' to {:#o}", path, permissions);

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        match fs::set_permissions(&path, fs::Permissions::from_mode(permissions)) {
            Ok(_) => {
                println!("SET_PERMS: Success for '{}'", path);
                Ok(())
            },
            Err(e) => {
                eprintln!("SET_PERMS: Failed for '{}': {}", path, e);
                Err(crate::error::AppError::Io(e.to_string()))
            }
        }
    }

    #[cfg(not(unix))]
    {
        // For Windows and other platforms, we can't set Unix-style permissions
        println!("SET_PERMS: Unix permissions not supported on this platform");
        Ok(())
    }
}

#[command]
pub async fn get_temp_directory() -> Result<String> {
    println!("GET_TEMP: Getting temp directory");
    let temp_path = env::temp_dir().display().to_string();
    println!("GET_TEMP: Temp directory is '{}'", temp_path);
    Ok(temp_path)
}

// Archive Commands
#[command]
pub async fn create_archive(_source_paths: Vec<String>, _archive_path: String, _format: ArchiveFormat) -> Result<()> {
    println!("CREATE_ARCHIVE: Request to create archive at '{}' from {:?}", _archive_path, _source_paths);
    eprintln!("CREATE_ARCHIVE: Feature not yet implemented");
    Err(crate::error::AppError::Archive("Archive creation not yet implemented. This feature will be available in a future version.".to_string()))
}

#[command]
pub async fn extract_archive(_archive_path: String, _destination: String) -> Result<()> {
    println!("EXTRACT_ARCHIVE: Request to extract '{}' to '{}'", _archive_path, _destination);
    eprintln!("EXTRACT_ARCHIVE: Feature not yet implemented");
    Err(crate::error::AppError::Archive("Archive extraction not yet implemented. This feature will be available in a future version.".to_string()))
}

#[command]
pub async fn list_archive_contents(_archive_path: String) -> Result<ArchiveInfo> {
    println!("LIST_ARCHIVE: Request to list contents of '{}'", _archive_path);
    eprintln!("LIST_ARCHIVE: Feature not yet implemented");
    Err(crate::error::AppError::Archive("Archive listing not yet implemented. This feature will be available in a future version.".to_string()))
}

// System Commands
#[command]
pub async fn get_system_info() -> Result<SystemInfo> {
    let platform = env::consts::OS.to_string();
    let arch = env::consts::ARCH.to_string();
    let version = env!("CARGO_PKG_VERSION").to_string();

    let home_directory = dirs::home_dir()
        .map(|p| p.display().to_string())
        .unwrap_or_else(|| "/".to_string());

    let current_directory = env::current_dir()
        .map(|p| p.display().to_string())
        .unwrap_or_else(|_| "/".to_string());

    let temp_directory = env::temp_dir().display().to_string();

    Ok(SystemInfo {
        platform,
        arch,
        version,
        home_directory,
        current_directory,
        temp_directory,
        total_memory: 0,      // TODO: Get actual memory info
        available_memory: 0,  // TODO: Get actual memory info
        cpu_count: num_cpus::get(),
    })
}

#[command]
pub async fn get_home_directory() -> Result<String> {
    println!("GET_HOME: Requesting home directory");

    let home_path = dirs::home_dir()
        .map(|p| p.display().to_string())
        .unwrap_or_else(|| {
            eprintln!("GET_HOME: Could not find home directory, using '/'");
            "/".to_string()
        });

    println!("GET_HOME: Home directory is '{}'", home_path);
    Ok(home_path)
}

#[command]
pub async fn get_desktop_directory() -> Result<String> {
    Ok(dirs::desktop_dir()
        .map(|p| p.display().to_string())
        .unwrap_or_else(|| {
            dirs::home_dir()
                .map(|p| p.display().to_string())
                .unwrap_or_else(|| "/".to_string())
        }))
}

#[command]
pub async fn get_documents_directory() -> Result<String> {
    Ok(dirs::document_dir()
        .map(|p| p.display().to_string())
        .unwrap_or_else(|| {
            dirs::home_dir()
                .map(|p| p.display().to_string())
                .unwrap_or_else(|| "/".to_string())
        }))
}

#[command]
pub async fn get_applications_directory() -> Result<String> {
    // macOS specific path
    #[cfg(target_os = "macos")]
    {
        Ok("/Applications".to_string())
    }

    #[cfg(not(target_os = "macos"))]
    {
        // For other platforms, return a reasonable default
        Ok("/usr/bin".to_string())
    }
}
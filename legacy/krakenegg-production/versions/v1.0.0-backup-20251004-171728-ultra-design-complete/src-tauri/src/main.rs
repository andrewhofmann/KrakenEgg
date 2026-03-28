// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod file_system;
mod error;
mod types;

use commands::*;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // File system operations
            list_directory,
            navigate_to_path,
            get_file_info,
            create_directory,
            rename_file,
            delete_file,
            copy_file,
            move_file,
            // Archive operations
            create_archive,
            extract_archive,
            list_archive_contents,
            // System operations
            get_system_info,
            get_home_directory,
            get_desktop_directory,
            get_documents_directory,
            get_applications_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
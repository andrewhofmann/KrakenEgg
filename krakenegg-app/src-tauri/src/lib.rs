// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;
use tauri::menu::{Menu, Submenu, MenuItem, PredefinedMenuItem, AboutMetadata};
use tauri::Emitter;
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use crate::models::OperationMap;
use crate::commands::WatcherMap;

pub mod models;
pub mod utils;
pub mod archive;
pub mod mrt;
pub mod app_state;
pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    println!("Tauri Builder starting...");
    tauri::Builder::default()
        .manage(OperationMap(Arc::new(Mutex::new(HashMap::new()))))
        .manage(WatcherMap(std::sync::Mutex::new(HashMap::new())))
        .setup(|app| {
            println!("Tauri setup hook running.");
            let main_window = app.get_webview_window("main");
            if let Some(window) = main_window {
                println!("Main window found: {:?}", window.label());
            } else {
                println!("Main window NOT found during setup!");
            }
            Ok(())
        })
        .menu(|handle| {
            let app_name = "KrakenEgg";
            
            // 1. App Menu (macOS specific mostly)
            let app_menu = Submenu::new(handle, app_name, true)?;
            app_menu.append(&PredefinedMenuItem::about(handle, Some("About KrakenEgg"), Some(AboutMetadata {
                version: Some("0.2.0".to_string()),
                authors: Some(vec!["Andrew Hofmann".to_string()]),
                comments: Some("A modern dual-pane file manager for macOS".to_string()),
                ..Default::default()
            }))?)?;
            app_menu.append(&PredefinedMenuItem::separator(handle)?)?;
            app_menu.append(&MenuItem::with_id(handle, "settings", "Settings...", true, Some("Cmd+,"))?)?;
            app_menu.append(&PredefinedMenuItem::separator(handle)?)?;
            app_menu.append(&PredefinedMenuItem::services(handle, None)?)?;
            app_menu.append(&PredefinedMenuItem::separator(handle)?)?;
            app_menu.append(&PredefinedMenuItem::hide(handle, None)?)?;
            app_menu.append(&PredefinedMenuItem::hide_others(handle, None)?)?;
            app_menu.append(&PredefinedMenuItem::show_all(handle, None)?)?;
            app_menu.append(&PredefinedMenuItem::separator(handle)?)?;
            app_menu.append(&PredefinedMenuItem::quit(handle, None)?)?;

            // 2. File
            let file_menu = Submenu::new(handle, "File", true)?;
            file_menu.append(&MenuItem::with_id(handle, "new_tab", "New Tab", true, Some("Cmd+T"))?)?;
            file_menu.append(&MenuItem::with_id(handle, "close_tab", "Close Tab", true, Some("Cmd+W"))?)?;
            file_menu.append(&PredefinedMenuItem::separator(handle)?)?;
            file_menu.append(&MenuItem::with_id(handle, "new_file", "New File", true, Some("Shift+F4"))?)?;
            file_menu.append(&MenuItem::with_id(handle, "new_folder", "New Folder", true, Some("F7"))?)?;
            file_menu.append(&PredefinedMenuItem::separator(handle)?)?;
            file_menu.append(&MenuItem::with_id(handle, "copy_to_opposite", "Copy to Other Pane", true, Some("F5"))?)?;
            file_menu.append(&MenuItem::with_id(handle, "move_to_opposite", "Move to Other Pane", true, Some("F6"))?)?;

            // 3. Edit
            let edit_menu = Submenu::new(handle, "Edit", true)?;
            edit_menu.append(&PredefinedMenuItem::undo(handle, None)?)?;
            edit_menu.append(&PredefinedMenuItem::redo(handle, None)?)?;
            edit_menu.append(&PredefinedMenuItem::separator(handle)?)?;
            edit_menu.append(&MenuItem::with_id(handle, "copy_files", "Copy", true, Some("Cmd+C"))?)?;
            edit_menu.append(&MenuItem::with_id(handle, "cut_files", "Cut", true, Some("Cmd+X"))?)?;
            edit_menu.append(&MenuItem::with_id(handle, "paste_files", "Paste", true, Some("Cmd+V"))?)?;
            edit_menu.append(&MenuItem::with_id(handle, "delete_files", "Delete", true, Some("Cmd+Backspace"))?)?;
            edit_menu.append(&PredefinedMenuItem::separator(handle)?)?;
            edit_menu.append(&MenuItem::with_id(handle, "select_all", "Select All", true, Some("Cmd+A"))?)?;
            edit_menu.append(&MenuItem::with_id(handle, "deselect_all", "Deselect All", true, Some("Cmd+D"))?)?;
            edit_menu.append(&MenuItem::with_id(handle, "invert_selection", "Invert Selection", true, Some("Cmd+Shift+A"))?)?;
            edit_menu.append(&PredefinedMenuItem::separator(handle)?)?;
            edit_menu.append(&MenuItem::with_id(handle, "rename", "Rename", true, Some("Shift+F6"))?)?;
            edit_menu.append(&MenuItem::with_id(handle, "multi_rename", "Multi-Rename Tool", true, Some("Cmd+M"))?)?;
            edit_menu.append(&PredefinedMenuItem::separator(handle)?)?;
            edit_menu.append(&MenuItem::with_id(handle, "compress", "Compress", true, Some("Alt+F5"))?)?;
            edit_menu.append(&MenuItem::with_id(handle, "extract", "Extract", true, Some("Alt+F9"))?)?;

            // 4. View
            let view_menu = Submenu::new(handle, "View", true)?;
            view_menu.append(&MenuItem::with_id(handle, "view_file", "View File", true, Some("F3"))?)?;
            view_menu.append(&MenuItem::with_id(handle, "edit_file", "Edit File", true, Some("F4"))?)?;
            view_menu.append(&PredefinedMenuItem::separator(handle)?)?;
            view_menu.append(&MenuItem::with_id(handle, "refresh", "Refresh", true, Some("F2"))?)?;
            view_menu.append(&MenuItem::with_id(handle, "quick_view", "Toggle Quick View", true, Some("Ctrl+Q"))?)?;
            view_menu.append(&MenuItem::with_id(handle, "toggle_hidden", "Toggle Hidden Files", true, Some("Ctrl+H"))?)?;
            view_menu.append(&PredefinedMenuItem::separator(handle)?)?;
            view_menu.append(&MenuItem::with_id(handle, "swap_panes", "Swap Panes", true, Some("Cmd+U"))?)?;
            view_menu.append(&MenuItem::with_id(handle, "search", "Search Files...", true, Some("Alt+F7"))?)?;

            // 5. Go
            let go_menu = Submenu::new(handle, "Go", true)?;
            go_menu.append(&MenuItem::with_id(handle, "go_back", "Back", true, Some("Cmd+["))?)?;
            go_menu.append(&MenuItem::with_id(handle, "go_forward", "Forward", true, Some("Cmd+]"))?)?;
            go_menu.append(&MenuItem::with_id(handle, "go_up", "Enclosing Folder", true, Some("Cmd+Up"))?)?;
            go_menu.append(&PredefinedMenuItem::separator(handle)?)?;
            go_menu.append(&MenuItem::with_id(handle, "go_to_path", "Go to Path...", true, Some("Cmd+Shift+G"))?)?;

            // 6. Window
            let window_menu = Submenu::new(handle, "Window", true)?;
            window_menu.append(&PredefinedMenuItem::minimize(handle, None)?)?;
            window_menu.append(&PredefinedMenuItem::separator(handle)?)?;
            window_menu.append(&PredefinedMenuItem::fullscreen(handle, None)?)?;

            Menu::with_items(handle, &[
                &app_menu,
                &file_menu,
                &edit_menu,
                &view_menu,
                &go_menu,
                &window_menu
            ])
        })
        .on_menu_event(|app, event| {
            let _ = app.emit("menu_event", event.id().as_ref());
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::list_directory,
            commands::get_recursive_info,
            commands::copy_items,
            commands::copy_items_with_progress,
            commands::move_items,
            commands::move_items_with_progress,
            commands::delete_items,
            commands::delete_items_with_progress,
            commands::cancel_operation,
            commands::resolve_conflict,
            commands::create_directory,
            commands::preview_file,
            commands::read_file_content,
            commands::write_file_content,
            commands::create_empty_file,
            commands::search_files,
            commands::compress_files,
            commands::compress_files_with_progress,
            commands::extract_archive,
            commands::save_app_state,
            commands::load_app_state,
            commands::open_with_default,
            commands::save_named_layout,
            commands::load_named_layout,
            commands::list_layouts,
            mrt::preview_mrt,
            mrt::execute_mrt,
            commands::get_home_directory,
            commands::calculate_folder_size,
            commands::watch_directory,
            commands::unwatch_directory
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
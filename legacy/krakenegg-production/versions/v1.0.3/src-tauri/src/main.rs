// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod file_system;
mod error;
mod types;

use commands::*;
use tauri::menu::{MenuBuilder, SubmenuBuilder, MenuItemBuilder, PredefinedMenuItem};
use tauri::Emitter;

#[tauri::command]
fn show_about() -> String {
    "KrakenEgg v1.0.2 - Modern Total Commander Clone".to_string()
}

fn create_menu(app_handle: &tauri::AppHandle) -> tauri::Result<tauri::menu::Menu<tauri::Wry>> {
    let app_menu = SubmenuBuilder::new(app_handle, "KrakenEgg")
        .item(&PredefinedMenuItem::about(app_handle, None, None)?)
        .separator()
        .item(&PredefinedMenuItem::services(app_handle, None)?)
        .separator()
        .item(&PredefinedMenuItem::hide(app_handle, None)?)
        .item(&PredefinedMenuItem::hide_others(app_handle, None)?)
        .item(&PredefinedMenuItem::show_all(app_handle, None)?)
        .separator()
        .item(&PredefinedMenuItem::quit(app_handle, None)?)
        .build()?;

    let file_menu = SubmenuBuilder::new(app_handle, "File")
        .item(&MenuItemBuilder::with_id("new_tab", "New Tab").accelerator("Cmd+T").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("close_tab", "Close Tab").accelerator("Cmd+W").build(app_handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("new_folder", "New Folder").accelerator("Cmd+Shift+N").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("new_file", "New File").accelerator("Cmd+N").build(app_handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("duplicate", "Duplicate").accelerator("Cmd+D").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("move_to_trash", "Move to Trash").accelerator("Cmd+Delete").build(app_handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("properties", "Get Info").accelerator("Cmd+I").build(app_handle)?)
        .build()?;

    let edit_menu = SubmenuBuilder::new(app_handle, "Edit")
        .item(&PredefinedMenuItem::undo(app_handle, None)?)
        .item(&PredefinedMenuItem::redo(app_handle, None)?)
        .separator()
        .item(&PredefinedMenuItem::cut(app_handle, None)?)
        .item(&PredefinedMenuItem::copy(app_handle, None)?)
        .item(&PredefinedMenuItem::paste(app_handle, None)?)
        .item(&PredefinedMenuItem::select_all(app_handle, None)?)
        .separator()
        .item(&MenuItemBuilder::with_id("find", "Find").accelerator("Cmd+F").build(app_handle)?)
        .build()?;

    let view_menu = SubmenuBuilder::new(app_handle, "View")
        .item(&MenuItemBuilder::with_id("show_toolbar", "Show Toolbar").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("show_status_bar", "Show Status Bar").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("show_path_bar", "Show Path Bar").build(app_handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("view_as_icons", "as Icons").accelerator("Cmd+1").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("view_as_list", "as List").accelerator("Cmd+2").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("view_as_columns", "as Columns").accelerator("Cmd+3").build(app_handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("arrange_by_name", "Arrange by Name").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("arrange_by_date", "Arrange by Date Modified").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("arrange_by_size", "Arrange by Size").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("arrange_by_type", "Arrange by Kind").build(app_handle)?)
        .build()?;

    let go_menu = SubmenuBuilder::new(app_handle, "Go")
        .item(&MenuItemBuilder::with_id("back", "Back").accelerator("Cmd+[").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("forward", "Forward").accelerator("Cmd+]").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("up", "Enclosing Folder").accelerator("Cmd+Up").build(app_handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("home", "Home").accelerator("Cmd+Shift+H").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("desktop", "Desktop").accelerator("Cmd+Shift+D").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("documents", "Documents").accelerator("Cmd+Shift+O").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("downloads", "Downloads").accelerator("Cmd+Shift+L").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("applications", "Applications").accelerator("Cmd+Shift+A").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("utilities", "Utilities").accelerator("Cmd+Shift+U").build(app_handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("go_to_folder", "Go to Folder...").accelerator("Cmd+Shift+G").build(app_handle)?)
        .build()?;

    let tools_menu = SubmenuBuilder::new(app_handle, "Tools")
        .item(&MenuItemBuilder::with_id("sync_dirs", "Synchronize Directories").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("compare_dirs", "Compare Directories").build(app_handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("compress", "Compress").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("extract", "Extract Archive").build(app_handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("network_connections", "Network Connections").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("ftp_connections", "FTP Connections").build(app_handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("preferences", "Preferences").accelerator("Cmd+,").build(app_handle)?)
        .build()?;

    let window_menu = SubmenuBuilder::new(app_handle, "Window")
        .item(&PredefinedMenuItem::minimize(app_handle, None)?)
        .item(&PredefinedMenuItem::maximize(app_handle, None)?)
        .separator()
        .item(&MenuItemBuilder::with_id("swap_panels", "Swap Panels").accelerator("Cmd+U").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("switch_panel", "Switch Panel").accelerator("Tab").build(app_handle)?)
        .build()?;

    let help_menu = SubmenuBuilder::new(app_handle, "Help")
        .item(&MenuItemBuilder::with_id("keyboard_shortcuts", "Keyboard Shortcuts").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("user_guide", "User Guide").build(app_handle)?)
        .separator()
        .item(&MenuItemBuilder::with_id("report_issue", "Report an Issue").build(app_handle)?)
        .item(&MenuItemBuilder::with_id("feature_request", "Request a Feature").build(app_handle)?)
        .build()?;

    MenuBuilder::new(app_handle)
        .item(&app_menu)
        .item(&file_menu)
        .item(&edit_menu)
        .item(&view_menu)
        .item(&go_menu)
        .item(&tools_menu)
        .item(&window_menu)
        .item(&help_menu)
        .build()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .menu(|app_handle| {
            create_menu(app_handle)
        })
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "show_about" => {
                    // Handle about menu item
                    println!("About KrakenEgg");
                },
                "new_tab" => {
                    // Emit event to frontend for new tab
                    app.emit("menu-action", "new_tab").unwrap();
                },
                "close_tab" => {
                    app.emit("menu-action", "close_tab").unwrap();
                },
                "new_folder" => {
                    app.emit("menu-action", "new_folder").unwrap();
                },
                "new_file" => {
                    app.emit("menu-action", "new_file").unwrap();
                },
                "duplicate" => {
                    app.emit("menu-action", "duplicate").unwrap();
                },
                "move_to_trash" => {
                    app.emit("menu-action", "move_to_trash").unwrap();
                },
                "properties" => {
                    app.emit("menu-action", "properties").unwrap();
                },
                "find" => {
                    app.emit("menu-action", "find").unwrap();
                },
                "show_toolbar" => {
                    app.emit("menu-action", "show_toolbar").unwrap();
                },
                "show_status_bar" => {
                    app.emit("menu-action", "show_status_bar").unwrap();
                },
                "show_path_bar" => {
                    app.emit("menu-action", "show_path_bar").unwrap();
                },
                "view_as_icons" => {
                    app.emit("menu-action", "view_as_icons").unwrap();
                },
                "view_as_list" => {
                    app.emit("menu-action", "view_as_list").unwrap();
                },
                "view_as_columns" => {
                    app.emit("menu-action", "view_as_columns").unwrap();
                },
                "arrange_by_name" => {
                    app.emit("menu-action", "arrange_by_name").unwrap();
                },
                "arrange_by_date" => {
                    app.emit("menu-action", "arrange_by_date").unwrap();
                },
                "arrange_by_size" => {
                    app.emit("menu-action", "arrange_by_size").unwrap();
                },
                "arrange_by_type" => {
                    app.emit("menu-action", "arrange_by_type").unwrap();
                },
                "back" => {
                    app.emit("menu-action", "back").unwrap();
                },
                "forward" => {
                    app.emit("menu-action", "forward").unwrap();
                },
                "up" => {
                    app.emit("menu-action", "up").unwrap();
                },
                "home" => {
                    app.emit("menu-action", "home").unwrap();
                },
                "desktop" => {
                    app.emit("menu-action", "desktop").unwrap();
                },
                "documents" => {
                    app.emit("menu-action", "documents").unwrap();
                },
                "downloads" => {
                    app.emit("menu-action", "downloads").unwrap();
                },
                "applications" => {
                    app.emit("menu-action", "applications").unwrap();
                },
                "utilities" => {
                    app.emit("menu-action", "utilities").unwrap();
                },
                "go_to_folder" => {
                    app.emit("menu-action", "go_to_folder").unwrap();
                },
                "sync_dirs" => {
                    app.emit("menu-action", "sync_dirs").unwrap();
                },
                "compare_dirs" => {
                    app.emit("menu-action", "compare_dirs").unwrap();
                },
                "compress" => {
                    app.emit("menu-action", "compress").unwrap();
                },
                "extract" => {
                    app.emit("menu-action", "extract").unwrap();
                },
                "network_connections" => {
                    app.emit("menu-action", "network_connections").unwrap();
                },
                "ftp_connections" => {
                    app.emit("menu-action", "ftp_connections").unwrap();
                },
                "preferences" => {
                    app.emit("menu-action", "preferences").unwrap();
                },
                "swap_panels" => {
                    app.emit("menu-action", "swap_panels").unwrap();
                },
                "switch_panel" => {
                    app.emit("menu-action", "switch_panel").unwrap();
                },
                "keyboard_shortcuts" => {
                    app.emit("menu-action", "keyboard_shortcuts").unwrap();
                },
                "user_guide" => {
                    app.emit("menu-action", "user_guide").unwrap();
                },
                "report_issue" => {
                    app.emit("menu-action", "report_issue").unwrap();
                },
                "feature_request" => {
                    app.emit("menu-action", "feature_request").unwrap();
                },
                _ => {}
            }
        })
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
            write_file,
            read_file,
            delete_directory,
            path_exists,
            get_file_size,
            set_file_permissions,
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
            get_temp_directory,
            // Menu operations
            show_about,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
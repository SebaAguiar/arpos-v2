mod commands;
mod managers;
mod utils;

use managers::backup::BackupManager;
use managers::database::DatabaseManager;
use managers::export::ExportManager;
use managers::license::LicenseManager;
use managers::process::ProcessManager;
use managers::system::SystemManager;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let resource_dir = app
                .path()
                .resource_dir()
                .map_err(|e| format!("Failed to resolve resource dir: {}", e))?;
            app.manage(ProcessManager::new(resource_dir));
            Ok(())
        })
        .manage(DatabaseManager::new())
        .manage(SystemManager::new())
        .manage(BackupManager::new())
        .manage(ExportManager::new())
        .manage(LicenseManager::new())
        .invoke_handler(tauri::generate_handler![
            // Process commands
            commands::process::start_backend,
            commands::process::stop_backend,
            commands::process::restart_backend,
            commands::process::get_backend_status,
            commands::process::wait_for_backend,
            // Database commands
            commands::database::init_database,
            commands::database::run_migrations,
            commands::database::push_schema,
            commands::database::check_db_integrity,
            commands::database::get_database_info,
            commands::database::ensure_database,
            // System commands
            commands::system::get_system_info,
            commands::system::get_cpu_usage,
            commands::system::get_memory_usage,
            commands::system::is_online,
            // Backup commands
            commands::backup::create_backup,
            commands::backup::list_backups,
            commands::backup::restore_backup,
            commands::backup::delete_backup,
            commands::backup::auto_backup,
            // Export commands
            commands::export::export_to_sql,
            commands::export::export_to_json,
            // License commands
            commands::license::get_license_token,
            commands::license::save_license_token,
            commands::license::clear_license_token,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

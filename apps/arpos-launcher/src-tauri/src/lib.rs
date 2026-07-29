mod commands;
mod managers;
mod utils;

use managers::backup::BackupManager;
use managers::database::DatabaseManager;
use managers::export::ExportManager;
use managers::process::ProcessManager;
use managers::system::SystemManager;
use managers::updater::UpdaterManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(ProcessManager::new())
        .manage(DatabaseManager::new())
        .manage(SystemManager::new())
        .manage(BackupManager::new())
        .manage(ExportManager::new())
        .manage(UpdaterManager::new())
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
            // Backup commands
            commands::backup::create_backup,
            commands::backup::list_backups,
            commands::backup::restore_backup,
            commands::backup::delete_backup,
            commands::backup::auto_backup,
            // Export commands
            commands::export::export_to_sql,
            commands::export::export_to_json,
            // Updater commands
            commands::updater::check_for_updates,
            commands::updater::download_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

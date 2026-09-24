use tauri::State;

use crate::managers::database::DatabaseManager;
use crate::managers::process::{BackendConfig, BackendStatus, ProcessManager};

#[tauri::command]
pub fn start_backend(
    process: State<'_, ProcessManager>,
    database: State<'_, DatabaseManager>,
) -> Result<String, String> {
    // A sidecar orphaned by an unclean previous exit still holds the SQLite
    // WAL lock. It MUST be killed before ensure_database() runs prisma migrate,
    // otherwise migrate fails with "database is locked" before we even spawn.
    process.kill_stale_sidecar();

    // Before spawning the sidecar, ensure the SQLite schema is present and up
    // to date. Failing closed here prevents booting against an empty DB, which
    // would otherwise answer 401 "Local workspace not configured" on every
    // request because no company row can exist without the tables.
    if !process.is_running() {
        database.ensure_database()?;
    }
    process.start()
}

#[tauri::command]
pub fn stop_backend(state: State<'_, ProcessManager>) -> Result<String, String> {
    state.stop()
}

#[tauri::command]
pub fn restart_backend(state: State<'_, ProcessManager>) -> Result<String, String> {
    state.restart()
}

#[tauri::command]
pub fn get_backend_status(state: State<'_, ProcessManager>) -> BackendStatus {
    state.status()
}

#[tauri::command]
pub fn get_backend_config(state: State<'_, ProcessManager>) -> Result<BackendConfig, String> {
    state.config()
}

#[tauri::command]
pub async fn wait_for_backend(state: State<'_, ProcessManager>) -> Result<String, String> {
    state.wait_for_health().await?;
    Ok("Backend is ready".to_string())
}

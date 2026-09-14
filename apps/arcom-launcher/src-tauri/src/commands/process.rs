use tauri::State;

use crate::managers::process::{BackendConfig, BackendStatus, ProcessManager};

#[tauri::command]
pub fn start_backend(state: State<'_, ProcessManager>) -> Result<String, String> {
    state.start()
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

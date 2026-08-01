use tauri::State;

use crate::managers::database::{DatabaseInfo, DatabaseManager};

#[tauri::command]
pub fn init_database(state: State<'_, DatabaseManager>) -> Result<String, String> {
    state.init()
}

#[tauri::command]
pub fn run_migrations(state: State<'_, DatabaseManager>) -> Result<String, String> {
    state.migrate()
}

#[tauri::command]
pub fn push_schema(state: State<'_, DatabaseManager>) -> Result<String, String> {
    state.push()
}

#[tauri::command]
pub fn check_db_integrity(state: State<'_, DatabaseManager>) -> Result<bool, String> {
    state.check_integrity()
}

#[tauri::command]
pub fn get_database_info(state: State<'_, DatabaseManager>) -> DatabaseInfo {
    state.info()
}

#[tauri::command]
pub fn ensure_database(state: State<'_, DatabaseManager>) -> Result<String, String> {
    state.ensure_database()
}

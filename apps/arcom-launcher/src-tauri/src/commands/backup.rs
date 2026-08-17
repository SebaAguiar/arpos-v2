use tauri::State;

use crate::managers::backup::{BackupInfo, BackupManager};

#[tauri::command]
pub fn create_backup(state: State<'_, BackupManager>) -> Result<BackupInfo, String> {
    state.create_backup()
}

#[tauri::command]
pub fn list_backups(state: State<'_, BackupManager>) -> Result<Vec<BackupInfo>, String> {
    state.list_backups()
}

#[tauri::command]
pub fn restore_backup(state: State<'_, BackupManager>, backup_path: String) -> Result<String, String> {
    state.restore_backup(&backup_path)
}

#[tauri::command]
pub fn delete_backup(state: State<'_, BackupManager>, backup_path: String) -> Result<String, String> {
    state.delete_backup(&backup_path)
}

#[tauri::command]
pub fn auto_backup(state: State<'_, BackupManager>) -> Result<Option<BackupInfo>, String> {
    state.auto_backup_if_needed()
}

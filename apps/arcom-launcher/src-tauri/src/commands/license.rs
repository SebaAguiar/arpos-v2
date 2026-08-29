use tauri::State;

use crate::managers::license::LicenseManager;

#[tauri::command]
pub fn get_license_token(state: State<'_, LicenseManager>) -> Result<Option<String>, String> {
    state.get_token()
}

#[tauri::command]
pub fn save_license_token(
    state: State<'_, LicenseManager>,
    token: String,
) -> Result<(), String> {
    state.save_token(&token)
}

#[tauri::command]
pub fn clear_license_token(state: State<'_, LicenseManager>) -> Result<(), String> {
    state.clear_token()
}

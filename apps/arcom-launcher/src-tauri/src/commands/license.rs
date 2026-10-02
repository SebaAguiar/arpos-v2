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

/// Reads the persisted device identity as an opaque JSON blob owned by the
/// frontend. `None` means fresh install.
#[tauri::command]
pub fn get_device_identity(state: State<'_, LicenseManager>) -> Result<Option<String>, String> {
    state.get_device_identity()
}

/// Persists the device identity blob with owner-only permissions (0600).
#[tauri::command]
pub fn save_device_identity(
    state: State<'_, LicenseManager>,
    identity: String,
) -> Result<(), String> {
    state.save_device_identity(&identity)
}

#[tauri::command]
pub fn clear_device_identity(state: State<'_, LicenseManager>) -> Result<(), String> {
    state.clear_device_identity()
}

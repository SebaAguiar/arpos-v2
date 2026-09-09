use tauri::State;

use crate::managers::updater::{UpdateInfo, UpdaterManager};

#[tauri::command]
pub async fn check_for_updates(
    state: State<'_, UpdaterManager>,
    current_version: String,
    plan_slug: Option<String>,
) -> Result<UpdateInfo, String> {
    state
        .check_for_updates(&current_version, plan_slug.as_deref())
        .await
}

#[tauri::command]
pub async fn download_update(
    state: State<'_, UpdaterManager>,
    url: String,
    dest_path: String,
) -> Result<String, String> {
    state.download_update(&url, &dest_path).await
}

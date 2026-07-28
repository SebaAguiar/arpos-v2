use tauri::State;

use crate::managers::export::{ExportManager, ExportResult};

#[tauri::command]
pub fn export_to_sql(
    state: State<'_, ExportManager>,
    output_path: Option<String>,
) -> Result<ExportResult, String> {
    state.export_to_sql(output_path.as_deref())
}

#[tauri::command]
pub fn export_to_json(
    state: State<'_, ExportManager>,
    output_path: Option<String>,
) -> Result<ExportResult, String> {
    state.export_to_json(output_path.as_deref())
}

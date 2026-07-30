use tauri::State;

use crate::managers::system::{SystemInfo, SystemManager};

#[tauri::command]
pub fn get_system_info(state: State<'_, SystemManager>) -> SystemInfo {
    state.get_info()
}

#[tauri::command]
pub fn get_cpu_usage(state: State<'_, SystemManager>) -> f32 {
    state.get_cpu_usage()
}

#[tauri::command]
pub fn get_memory_usage(state: State<'_, SystemManager>) -> (u64, u64, f32) {
    state.get_memory_usage()
}

#[tauri::command]
pub fn is_online() -> bool {
    SystemManager::is_online()
}

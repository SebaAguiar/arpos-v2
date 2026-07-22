use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

struct ProcessManager {
    nestjs_process: Mutex<Option<Child>>,
}

impl ProcessManager {
    fn new() -> Self {
        Self {
            nestjs_process: Mutex::new(None),
        }
    }

    fn spawn_nestjs(&self) -> Result<String, String> {
        let mut process = self.nestjs_process.lock().map_err(|e| e.to_string())?;
        
        if process.is_some() {
            return Ok("NestJS already running".to_string());
        }

        let child = Command::new("node")
            .arg("dist/main.js")
            .current_dir("../api")
            .spawn()
            .map_err(|e| format!("Failed to spawn NestJS: {}", e))?;

        *process = Some(child);
        Ok("NestJS started".to_string())
    }

    fn kill_nestjs(&self) -> Result<String, String> {
        let mut process = self.nestjs_process.lock().map_err(|e| e.to_string())?;
        
        if let Some(ref mut child) = *process {
            child.kill().map_err(|e| format!("Failed to kill NestJS: {}", e))?;
            *process = None;
            Ok("NestJS stopped".to_string())
        } else {
            Ok("NestJS not running".to_string())
        }
    }
}

#[tauri::command]
fn start_backend(state: tauri::State<'_, ProcessManager>) -> Result<String, String> {
    state.spawn_nestjs()
}

#[tauri::command]
fn stop_backend(state: tauri::State<'_, ProcessManager>) -> Result<String, String> {
    state.kill_nestjs()
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(ProcessManager::new())
        .invoke_handler(tauri::generate_handler![
            greet,
            start_backend,
            stop_backend
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

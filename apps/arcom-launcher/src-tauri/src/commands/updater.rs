use serde::Serialize;
use tauri::utils::platform::bundle_type;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdaterEnvironment {
    pub format: String,
    pub os: String,
    pub arch: String,
}

#[tauri::command]
pub fn get_updater_environment() -> UpdaterEnvironment {
    UpdaterEnvironment {
        format: bundle_type()
            .map(|bundle_type| bundle_type.to_string())
            .unwrap_or_else(|| "unknown".to_string()),
        os: updater_os().to_string(),
        arch: updater_arch().to_string(),
    }
}

fn updater_os() -> &'static str {
    match std::env::consts::OS {
        "macos" => "darwin",
        "windows" => "windows",
        _ => "linux",
    }
}

fn updater_arch() -> &'static str {
    match std::env::consts::ARCH {
        "x86" => "i686",
        "x86_64" => "x86_64",
        "aarch64" => "aarch64",
        other => other,
    }
}
use std::path::PathBuf;

const APP_NAME: &str = "arcom";
const DB_NAME: &str = "app.db";
const BACKEND_TOKEN_FILE: &str = ".backend_token";

pub fn get_home_dir() -> PathBuf {
    dirs::home_dir().unwrap_or_else(|| PathBuf::from("."))
}

pub fn get_data_dir() -> PathBuf {
    get_home_dir().join(format!(".{}", APP_NAME)).join("data")
}

pub fn get_backup_dir() -> PathBuf {
    get_home_dir().join(format!(".{}", APP_NAME)).join("backup")
}

pub fn get_db_path() -> PathBuf {
    get_data_dir().join(DB_NAME)
}

pub fn get_backend_token_file() -> PathBuf {
    get_data_dir().join(BACKEND_TOKEN_FILE)
}

pub fn get_export_dir() -> PathBuf {
    get_home_dir().join(format!(".{}", APP_NAME)).join("export")
}

pub fn ensure_data_dir() -> Result<PathBuf, String> {
    let dir = get_data_dir();
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create data directory {:?}: {}", dir, e))?;
    Ok(dir)
}

pub fn ensure_backup_dir() -> Result<PathBuf, String> {
    let dir = get_backup_dir();
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create backup directory {:?}: {}", dir, e))?;
    Ok(dir)
}

pub fn ensure_export_dir() -> Result<PathBuf, String> {
    let dir = get_export_dir();
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create export directory {:?}: {}", dir, e))?;
    Ok(dir)
}

pub fn get_project_root() -> PathBuf {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    manifest_dir
        .parent()
        .and_then(|p| p.parent())
        .and_then(|p| p.parent())
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|| manifest_dir)
}

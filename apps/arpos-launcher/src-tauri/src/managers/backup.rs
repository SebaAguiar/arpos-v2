use std::fs;
use std::path::PathBuf;

use crate::utils::paths;

#[derive(Debug, Clone, serde::Serialize)]
pub struct BackupInfo {
    pub filename: String,
    pub path: String,
    pub size_bytes: u64,
    pub created_at: String,
}

pub struct BackupManager;

impl BackupManager {
    pub fn new() -> Self {
        Self
    }

    pub fn create_backup(&self) -> Result<BackupInfo, String> {
        let db_path = paths::get_db_path();
        if !db_path.exists() {
            return Err("Database file does not exist".to_string());
        }

        let backup_dir = paths::ensure_backup_dir()?;
        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
        let filename = format!("app_{}.db", timestamp);
        let backup_path = backup_dir.join(&filename);

        fs::copy(&db_path, &backup_path)
            .map_err(|e| format!("Failed to create backup: {}", e))?;

        let metadata = fs::metadata(&backup_path)
            .map_err(|e| format!("Failed to read backup metadata: {}", e))?;

        Ok(BackupInfo {
            filename,
            path: backup_path.to_string_lossy().to_string(),
            size_bytes: metadata.len(),
            created_at: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
        })
    }

    pub fn list_backups(&self) -> Result<Vec<BackupInfo>, String> {
        let backup_dir = paths::get_backup_dir();
        if !backup_dir.exists() {
            return Ok(vec![]);
        }

        let mut backups: Vec<BackupInfo> = Vec::new();

        let entries = fs::read_dir(&backup_dir)
            .map_err(|e| format!("Failed to read backup directory: {}", e))?;

        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();

            if path.extension().and_then(|e| e.to_str()) == Some("db") {
                let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
                let created = metadata
                    .modified()
                    .map(|t| {
                        let datetime: chrono::DateTime<chrono::Local> = t.into();
                        datetime.format("%Y-%m-%d %H:%M:%S").to_string()
                    })
                    .unwrap_or_else(|_| "Unknown".to_string());

                backups.push(BackupInfo {
                    filename: path
                        .file_name()
                        .map(|f| f.to_string_lossy().to_string())
                        .unwrap_or_default(),
                    path: path.to_string_lossy().to_string(),
                    size_bytes: metadata.len(),
                    created_at: created,
                });
            }
        }

        backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        Ok(backups)
    }

    pub fn restore_backup(&self, backup_path: &str) -> Result<String, String> {
        let source = PathBuf::from(backup_path);
        if !source.exists() {
            return Err(format!("Backup file not found: {}", backup_path));
        }

        let db_path = paths::get_db_path();

        fs::copy(&source, &db_path)
            .map_err(|e| format!("Failed to restore backup: {}", e))?;

        Ok(format!("Database restored from {}", backup_path))
    }

    pub fn delete_backup(&self, backup_path: &str) -> Result<String, String> {
        let path = PathBuf::from(backup_path);

        if !path.exists() {
            return Err("Backup file not found".to_string());
        }

        if !path
            .parent()
            .map(|p| p == paths::get_backup_dir())
            .unwrap_or(false)
        {
            return Err("Cannot delete backup outside backup directory".to_string());
        }

        fs::remove_file(&path).map_err(|e| format!("Failed to delete backup: {}", e))?;

        Ok(format!("Backup deleted: {}", backup_path))
    }

    pub fn auto_backup_if_needed(&self) -> Result<Option<BackupInfo>, String> {
        let backups = self.list_backups()?;

        if let Some(latest) = backups.first() {
            let parsed = chrono::NaiveDateTime::parse_from_str(
                &latest.created_at,
                "%Y-%m-%d %H:%M:%S",
            );

            if let Ok(datetime) = parsed {
                let now = chrono::Local::now().naive_local();
                let duration = now.signed_duration_since(datetime);
                if duration < chrono::Duration::hours(24) {
                    return Ok(None);
                }
            }
        }

        let backup = self.create_backup()?;
        Ok(Some(backup))
    }
}

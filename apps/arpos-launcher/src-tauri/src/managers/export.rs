use std::fs;
use std::path::PathBuf;
use std::process::{Command, Stdio};

use crate::utils::paths;

#[derive(Debug, Clone, serde::Serialize)]
pub struct ExportResult {
    pub path: String,
    pub format: String,
    pub size_bytes: u64,
}

pub struct ExportManager;

impl ExportManager {
    pub fn new() -> Self {
        Self
    }

    pub fn export_to_sql(&self, output_path: Option<&str>) -> Result<ExportResult, String> {
        let db_path = paths::get_db_path();
        if !db_path.exists() {
            return Err("Database file does not exist".to_string());
        }

        let target = match output_path {
            Some(p) => PathBuf::from(p),
            None => {
                let export_dir = paths::ensure_export_dir()?;
                let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
                export_dir.join(format!("arpos_export_{}.sql", timestamp))
            }
        };

        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create export directory: {}", e))?;
        }

        let sqlite3_bin = which_sqlite3().ok_or("sqlite3 not found in PATH")?;

        let output = Command::new(&sqlite3_bin)
            .arg(db_path.to_str().unwrap())
            .arg(".dump")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .map_err(|e| format!("Failed to dump database: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("SQLite dump failed: {}", stderr));
        }

        let sql = String::from_utf8_lossy(&output.stdout);
        let converted = convert_sqlite_to_postgres(&sql);

        fs::write(&target, &converted)
            .map_err(|e| format!("Failed to write export file: {}", e))?;

        let metadata = fs::metadata(&target)
            .map_err(|e| format!("Failed to read export metadata: {}", e))?;

        Ok(ExportResult {
            path: target.to_string_lossy().to_string(),
            format: "sql".to_string(),
            size_bytes: metadata.len(),
        })
    }

    pub fn export_to_json(&self, output_path: Option<&str>) -> Result<ExportResult, String> {
        let db_path = paths::get_db_path();
        if !db_path.exists() {
            return Err("Database file does not exist".to_string());
        }

        let target = match output_path {
            Some(p) => PathBuf::from(p),
            None => {
                let export_dir = paths::ensure_export_dir()?;
                let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
                export_dir.join(format!("arpos_export_{}.json", timestamp))
            }
        };

        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create export directory: {}", e))?;
        }

        let sqlite3_bin = which_sqlite3().ok_or("sqlite3 not found in PATH")?;

        let tables_output = Command::new(&sqlite3_bin)
            .arg(db_path.to_str().unwrap())
            .arg("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .map_err(|e| format!("Failed to list tables: {}", e))?;

        if !tables_output.status.success() {
            return Err("Failed to list database tables".to_string());
        }

        let tables = String::from_utf8_lossy(&tables_output.stdout);
        let mut export_data = serde_json::Map::new();

        for table in tables.lines() {
            let table = table.trim();
            if table.is_empty() {
                continue;
            }

            let json_output = Command::new(&sqlite3_bin)
                .arg(db_path.to_str().unwrap())
                .arg(".mode json")
                .arg(".headers on")
                .arg(format!("SELECT * FROM {};", table))
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output()
                .map_err(|e| format!("Failed to export table {}: {}", table, e))?;

            if json_output.status.success() {
                let json_str = String::from_utf8_lossy(&json_output.stdout);
                if let Ok(rows) = serde_json::from_str::<serde_json::Value>(&json_str) {
                    export_data.insert(table.to_string(), rows);
                }
            }
        }

        let json = serde_json::to_string_pretty(&export_data)
            .map_err(|e| format!("Failed to serialize JSON: {}", e))?;

        fs::write(&target, &json)
            .map_err(|e| format!("Failed to write export file: {}", e))?;

        let metadata = fs::metadata(&target)
            .map_err(|e| format!("Failed to read export metadata: {}", e))?;

        Ok(ExportResult {
            path: target.to_string_lossy().to_string(),
            format: "json".to_string(),
            size_bytes: metadata.len(),
        })
    }
}

fn which_sqlite3() -> Option<String> {
    let possible_paths = if cfg!(windows) {
        vec!["sqlite3.exe"]
    } else {
        vec![
            "sqlite3",
            "/usr/bin/sqlite3",
            "/usr/local/bin/sqlite3",
            "/opt/homebrew/bin/sqlite3",
        ]
    };

    for path in &possible_paths {
        if Command::new(path)
            .arg("--version")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .is_ok()
        {
            return Some(path.to_string());
        }
    }

    None
}

fn convert_sqlite_to_postgres(sql: &str) -> String {
    let mut result = sql.to_string();

    result = result.replace("INTEGER PRIMARY KEY", "SERIAL PRIMARY KEY");
    result = result.replace("AUTOINCREMENT", "");
    result = result.replace("Boolean", "BOOLEAN");
    result = result.replace("TEXT", "TEXT");
    result = result.replace("INTEGER", "INTEGER");
    result = result.replace("REAL", "REAL");
    result = result.replace("BLOB", "BYTEA");

    let lines: Vec<&str> = result.lines().collect();
    let mut converted = Vec::new();

    for line in lines {
        let trimmed = line.trim();
        if trimmed.starts_with("CREATE TABLE") {
            converted.push(line.replace("CREATE TABLE", "CREATE TABLE IF NOT EXISTS"));
        } else if trimmed.starts_with("INSERT OR IGNORE INTO") {
            converted.push(line.replace("INSERT OR IGNORE INTO", "INSERT INTO"));
        } else if trimmed.starts_with("INSERT INTO") && trimmed.contains("VALUES") {
            let replaced = line.replace("''", "NULL");
            converted.push(replaced);
        } else {
            converted.push(line.to_string());
        }
    }

    converted.join("\n")
}

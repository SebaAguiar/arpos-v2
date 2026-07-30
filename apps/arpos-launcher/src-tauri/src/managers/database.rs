use std::process::{Command, Stdio};

use crate::utils::paths;

#[derive(Debug, Clone, serde::Serialize)]
pub struct DatabaseInfo {
    pub exists: bool,
    pub path: String,
    pub size_bytes: u64,
    pub migrations_applied: bool,
}

pub struct DatabaseManager;

impl DatabaseManager {
    pub fn new() -> Self {
        Self
    }

pub fn configure(&self) -> Result<String, String> {
        let db_path = paths::get_db_path();
        if !db_path.exists() {
            return Err("Database not found".to_string());
        }

        let sqlite3_bin = which_sqlite3().ok_or("sqlite3 not found in PATH")?;

        let output = Command::new(&sqlite3_bin)
            .arg(db_path.to_str().unwrap())
            .arg("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .map_err(|e| format!("Failed to configure SQLite: {}", e))?;

        if output.status.success() {
            Ok("SQLite configured: WAL mode + foreign keys".to_string())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("SQLite configuration failed: {}", stderr.trim()))
        }
    }

    pub fn init(&self) -> Result<String, String> {
        paths::ensure_data_dir()?;

        let db_path = paths::get_db_path();
        if !db_path.exists() {
            std::fs::write(&db_path, "")
                .map_err(|e| format!("Failed to create database file: {}", e))?;
            self.configure()?;
            return Ok(format!("Database created at {:?}", db_path));
        }

        self.configure().ok();
        Ok(format!("Database already exists at {:?}", db_path))
    }

    pub fn migrate(&self) -> Result<String, String> {
        let project_root = paths::get_project_root();
        let api_dir = project_root.join("apps").join("pos-api");
        let prisma_dir = api_dir.join("prisma");
        let db_path = paths::get_db_path();

        if !prisma_dir.join("schema.prisma").exists() {
            return Err(format!(
                "Prisma schema not found at {:?}",
                prisma_dir.join("schema.prisma")
            ));
        }

        let prisma_bin = api_dir
            .join("node_modules")
            .join(".bin")
            .join("prisma");

        if !prisma_bin.exists() {
            return Err(format!(
                "Prisma binary not found at {:?}. Run 'pnpm install' first.",
                prisma_bin
            ));
        }

        let output = Command::new(&prisma_bin)
            .arg("migrate")
            .arg("deploy")
            .current_dir(&api_dir)
            .env("DATABASE_URL", format!("file:{}", db_path.display()))
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .map_err(|e| format!("Failed to run prisma migrate: {}", e))?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            Ok(format!("Migrations applied successfully: {}", stdout.trim()))
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("Migration failed: {}", stderr.trim()))
        }
    }

    pub fn push(&self) -> Result<String, String> {
        let project_root = paths::get_project_root();
        let api_dir = project_root.join("apps").join("pos-api");
        let db_path = paths::get_db_path();

        let prisma_bin = api_dir
            .join("node_modules")
            .join(".bin")
            .join("prisma");

        if !prisma_bin.exists() {
            return Err("Prisma binary not found. Run 'pnpm install' first.".to_string());
        }

        let output = Command::new(&prisma_bin)
            .arg("db")
            .arg("push")
            .current_dir(&api_dir)
            .env("DATABASE_URL", format!("file:{}", db_path.display()))
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .map_err(|e| format!("Failed to run prisma db push: {}", e))?;

        if output.status.success() {
            Ok("Schema pushed to database successfully".to_string())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("db push failed: {}", stderr.trim()))
        }
    }

    pub fn check_integrity(&self) -> Result<bool, String> {
        let db_path = paths::get_db_path();

        if !db_path.exists() {
            return Ok(false);
        }

        let project_root = paths::get_project_root();
        let api_dir = project_root.join("apps").join("pos-api");

        let sqlite3_bin = which_sqlite3().ok_or("sqlite3 not found in PATH")?;

        let output = Command::new(&sqlite3_bin)
            .arg(db_path.to_str().unwrap())
            .arg("PRAGMA integrity_check;")
            .current_dir(&api_dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .map_err(|e| format!("Failed to run integrity check: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.trim() == "ok")
    }

    pub fn info(&self) -> DatabaseInfo {
        let db_path = paths::get_db_path();
        let exists = db_path.exists();
        let size_bytes = if exists {
            std::fs::metadata(&db_path)
                .map(|m| m.len())
                .unwrap_or(0)
        } else {
            0
        };

        let migrations_applied = if exists {
            self.check_integrity().unwrap_or(false)
        } else {
            false
        };

        DatabaseInfo {
            exists,
            path: db_path.to_string_lossy().to_string(),
            size_bytes,
            migrations_applied,
        }
    }

    pub fn ensure_database(&self) -> Result<String, String> {
        self.init()?;
        self.configure()?;
        self.migrate()?;
        Ok("Database initialized and migrations applied".to_string())
    }
}

pub(crate) fn which_sqlite3() -> Option<String> {
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

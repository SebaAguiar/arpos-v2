use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::time::Duration;

use crate::utils::paths;

const MIGRATE_MAX_RETRIES: u32 = 3;
const MIGRATE_RETRY_DELAY_MS: u64 = 500;

#[derive(Debug, Clone, serde::Serialize)]
pub struct DatabaseInfo {
    pub exists: bool,
    pub path: String,
    pub size_bytes: u64,
    pub migrations_applied: bool,
}

pub struct DatabaseManager {
    resource_dir: PathBuf,
}

struct PrismaContext {
    api_dir: PathBuf,
    prisma_entry: PathBuf,
    node_bin: PathBuf,
}

impl DatabaseManager {
    pub fn new(resource_dir: PathBuf) -> Self {
        Self { resource_dir }
    }

    // Locate the Prisma CLI + schema for the current environment:
    // - Production: the bundled runtime (node + prisma CLI + schema.prisma +
    //   migrations ship inside the installer's resource dir).
    // - Development: the repository checkout with a system Node.js.
    fn resolve_prisma_context(&self) -> Result<PrismaContext, String> {
        // Production bundle layout:
        //   resource_dir/runtime/node/bin/node
        //   resource_dir/runtime/api/node_modules/prisma/build/index.js
        //   resource_dir/runtime/api/prisma/schema.prisma
        let runtime_node = if cfg!(windows) {
            self.resource_dir.join("runtime").join("node").join("node.exe")
        } else {
            self.resource_dir
                .join("runtime")
                .join("node")
                .join("bin")
                .join("node")
        };
        let runtime_api = self.resource_dir.join("runtime").join("api");
        let runtime_prisma = runtime_api
            .join("node_modules")
            .join("prisma")
            .join("build")
            .join("index.js");

        if runtime_node.exists() && runtime_api.join("prisma").join("schema.prisma").exists() {
            if runtime_prisma.exists() {
                return Ok(PrismaContext {
                    api_dir: runtime_api,
                    prisma_entry: runtime_prisma,
                    node_bin: runtime_node,
                });
            }
            return Err(format!(
                "Bundled backend has no Prisma CLI at {:?}: runtime was built before prisma \
                 became a production dependency. Re-run build-sidecar.mjs.",
                runtime_prisma
            ));
        }

        // Development: repository checkout.
        let project_root = paths::get_project_root();
        let api_dir = project_root.join("apps").join("api");
        let schema_path = api_dir.join("prisma").join("schema.prisma");
        if !schema_path.exists() {
            return Err(format!(
                "Prisma schema not found at {:?}. Run 'pnpm install' and 'pnpm --filter api build' first.",
                schema_path
            ));
        }

        // The prisma CLI lives in different places depending on the pnpm layout:
        // isolated linking (CI) or shamefully-hoist (local dev).
        let candidates = [
            api_dir.join("node_modules").join("prisma").join("build").join("index.js"),
            project_root
                .join("node_modules")
                .join("prisma")
                .join("build")
                .join("index.js"),
        ];
        let prisma_entry = candidates
            .iter()
            .find(|p| p.exists())
            .ok_or("Prisma CLI not found. Run 'pnpm install' first.")?;

        let node_bin = which_node().ok_or("Node.js not found in PATH")?;

        Ok(PrismaContext {
            api_dir,
            prisma_entry: prisma_entry.clone(),
            node_bin: PathBuf::from(node_bin),
        })
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

    // Best-effort: Prisma enables WAL + foreign_keys On per connection for
    // SQLite, so the PRAGMAs below are an optimization on top. On a clean
    // machine sqlite3 may be absent; never let that block DB initialization.
    fn configure_best_effort(&self) {
        if let Ok(msg) = self.configure() {
            eprintln!("[database] {msg}");
        }
    }

    pub fn init(&self) -> Result<String, String> {
        paths::ensure_data_dir()?;

        let db_path = paths::get_db_path();
        if !db_path.exists() {
            std::fs::write(&db_path, "")
                .map_err(|e| format!("Failed to create database file: {}", e))?;
            return Ok(format!("Database created at {:?}", db_path));
        }

        Ok(format!("Database already exists at {:?}", db_path))
    }

    fn run_prisma(&self, args: &[&str]) -> Result<String, String> {
        let ctx = self.resolve_prisma_context()?;
        let db_path = paths::get_db_path();
        let schema_path = ctx.api_dir.join("prisma").join("schema.prisma");

        let output = Command::new(&ctx.node_bin)
            .arg(&ctx.prisma_entry)
            .args(args)
            .arg("--schema")
            .arg(&schema_path)
            .current_dir(&ctx.api_dir)
            .env("DATABASE_URL", format!("file:{}", db_path.display()))
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .map_err(|e| format!("Failed to run prisma: {}", e))?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("Prisma failed: {}", stderr.trim()))
        }
    }

    pub fn migrate(&self) -> Result<String, String> {
        let context = self.resolve_prisma_context()?;
        if !context.api_dir.join("prisma").join("migrations").exists() {
            return Err(format!(
                "Prisma migrations folder not found at {:?}. Run 'pnpm --filter api prisma:migrate'.",
                context.api_dir.join("prisma").join("migrations")
            ));
        }

        // A sidecar orphaned by a previous run may still be releasing the WAL
        // lock for a few hundred ms after we killed it. prisma migrate deploy
        // then fails with "database is locked"; retrying with a short backoff
        // lets SQLite recover without forcing the user to start the app again.
        let mut last_error = String::new();
        for attempt in 0..MIGRATE_MAX_RETRIES {
            match self.run_prisma(&["migrate", "deploy"]) {
                Ok(stdout) => {
                    return Ok(format!("Migrations applied successfully: {}", stdout));
                }
                Err(err) => {
                    last_error = err;
                    if !is_lock_error(&last_error) || attempt + 1 == MIGRATE_MAX_RETRIES {
                        break;
                    }
                    eprintln!(
                        "[database] migrate hit a lock conflict; retrying ({}/{}): {}",
                        attempt + 1,
                        MIGRATE_MAX_RETRIES,
                        last_error
                    );
                    std::thread::sleep(Duration::from_millis(
                        MIGRATE_RETRY_DELAY_MS * (attempt as u64 + 1),
                    ));
                }
            }
        }
        Err(last_error)
    }

    pub fn push(&self) -> Result<String, String> {
        let stdout = self.run_prisma(&["db", "push"])?;
        Ok(format!("Schema pushed to database successfully: {}", stdout))
    }

    pub fn check_integrity(&self) -> Result<bool, String> {
        let db_path = paths::get_db_path();

        if !db_path.exists() {
            return Ok(false);
        }

        let sqlite3_bin = which_sqlite3().ok_or("sqlite3 not found in PATH")?;

        let output = Command::new(&sqlite3_bin)
            .arg(db_path.to_str().unwrap())
            .arg("PRAGMA integrity_check;")
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
        self.migrate()?;
        self.configure_best_effort();
        Ok("Database initialized and migrations applied".to_string())
    }
}

fn is_lock_error(msg: &str) -> bool {
    msg.contains("database is locked") || msg.contains("SQLITE_BUSY")
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

fn which_node() -> Option<String> {
    let possible_paths = if cfg!(windows) {
        vec![
            "node.exe",
            "C:\\Program Files\\nodejs\\node.exe",
            "C:\\Program Files (x86)\\nodejs\\node.exe",
        ]
    } else {
        vec![
            "node",
            "/usr/local/bin/node",
            "/usr/bin/node",
            "/opt/homebrew/bin/node",
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

    which_native("node")
}

fn which_native(bin: &str) -> Option<String> {
    let output = if cfg!(windows) {
        Command::new("where").arg(bin).output().ok()
    } else {
        Command::new("which").arg(bin).output().ok()
    };

    output.and_then(|o| {
        if o.status.success() {
            String::from_utf8(o.stdout)
                .ok()
                .map(|s| s.trim().lines().next().unwrap_or("").to_string())
        } else {
            None
        }
    })
}

use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use crate::utils::paths;

pub const HEALTH_CHECK_URL: &str = "http://localhost:3000/api/health";
pub const HEALTH_CHECK_TIMEOUT: u64 = 30;
pub const HEALTH_CHECK_INTERVAL: u64 = 500;
const PORT: u16 = 3000;

#[derive(Debug, Clone, serde::Serialize)]
pub struct BackendStatus {
    pub running: bool,
    pub port: u16,
    pub pid: Option<u32>,
    pub uptime_seconds: Option<f64>,
}

pub struct ProcessManager {
    child: Mutex<Option<Child>>,
    started_at: Mutex<Option<Instant>>,
}

impl ProcessManager {
    pub fn new() -> Self {
        Self {
            child: Mutex::new(None),
            started_at: Mutex::new(None),
        }
    }

    pub fn is_running(&self) -> bool {
        let mut child = self.child.lock().unwrap();
        if let Some(ref mut proc) = *child {
            match proc.try_wait() {
                Ok(Some(_)) => {
                    *child = None;
                    false
                }
                Ok(None) => true,
                Err(_) => {
                    *child = None;
                    false
                }
            }
        } else {
            false
        }
    }

    pub fn start(&self) -> Result<String, String> {
        if self.is_running() {
            return Ok("Backend already running".to_string());
        }

        let project_root = paths::get_project_root();
        let dist_path = project_root.join("apps").join("api").join("dist").join("main.js");

        if !dist_path.exists() {
            return Err(format!(
                "Backend not built. Expected {:?}. Run 'pnpm --filter api build' first.",
                dist_path
            ));
        }

        let db_path = paths::get_db_path();
        paths::ensure_data_dir()?;

        let node_bin = which_node().ok_or("Node.js not found in PATH")?;

        let child = Command::new(node_bin)
            .arg(dist_path.to_str().unwrap())
            .current_dir(&project_root)
            .env("NODE_ENV", "production")
            .env("PORT", PORT.to_string())
            .env("DATABASE_URL", format!("file:{}", db_path.display()))
            .env("LOCAL_MODE", "true")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn NestJS backend: {}", e))?;

        let pid = child.id();
        {
            let mut guard = self.child.lock().unwrap();
            *guard = Some(child);
        }
        {
            let mut guard = self.started_at.lock().unwrap();
            *guard = Some(Instant::now());
        }

        Ok(format!("Backend started with PID {}", pid))
    }

    pub fn stop(&self) -> Result<String, String> {
        let mut child = self.child.lock().unwrap();
        let mut started = self.started_at.lock().unwrap();

        if let Some(ref mut proc) = *child {
            let pid = proc.id();

            #[cfg(unix)]
            {
                use nix::sys::signal::{kill, Signal};
                use nix::unistd::Pid;
                let _ = kill(
                    Pid::from_raw(pid as i32),
                    Signal::SIGTERM,
                );
                std::thread::sleep(Duration::from_millis(1000));
            }

            match proc.try_wait() {
                Ok(Some(_)) => {}
                _ => {
                    let _ = proc.kill();
                }
            }

            *child = None;
            *started = None;
            Ok(format!("Backend stopped (PID {})", pid))
        } else {
            Ok("Backend not running".to_string())
        }
    }

    pub fn status(&self) -> BackendStatus {
        let running = self.is_running();
        let pid = self.child.lock().unwrap().as_ref().map(|c| c.id());
        let uptime = self.started_at.lock().unwrap().map(|t| t.elapsed().as_secs_f64());

        BackendStatus {
            running,
            port: PORT,
            pid,
            uptime_seconds: uptime,
        }
    }

    pub async fn wait_for_health(&self) -> Result<(), String> {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(2))
            .build()
            .map_err(|e| e.to_string())?;

        let start = Instant::now();
        let timeout = Duration::from_secs(HEALTH_CHECK_TIMEOUT);

        loop {
            if start.elapsed() > timeout {
                return Err(format!(
                    "Backend health check timed out after {}s",
                    HEALTH_CHECK_TIMEOUT
                ));
            }

            match client.get(HEALTH_CHECK_URL).send().await {
                Ok(resp) if resp.status().is_success() => return Ok(()),
                _ => {
                    tokio::time::sleep(Duration::from_millis(HEALTH_CHECK_INTERVAL)).await;
                }
            }
        }
    }

    pub fn restart(&self) -> Result<String, String> {
        self.stop()?;
        std::thread::sleep(Duration::from_millis(500));
        self.start()
    }
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

use std::fs::{File, OpenOptions};
use std::path::PathBuf;
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

struct BackendRuntime {
    node_bin: PathBuf,
    main_script: PathBuf,
    cwd: PathBuf,
}

pub struct ProcessManager {
    child: Mutex<Option<Child>>,
    started_at: Mutex<Option<Instant>>,
    resource_dir: PathBuf,
}

impl ProcessManager {
    pub fn new(resource_dir: PathBuf) -> Self {
        Self {
            child: Mutex::new(None),
            started_at: Mutex::new(None),
            resource_dir,
        }
    }

    fn resolve_runtime(&self) -> Result<BackendRuntime, String> {
        // Production: runtime bundled into the installer's resource dir.
        let runtime_dir = self.resource_dir.join("runtime");
        let prod_node = if cfg!(windows) {
            runtime_dir.join("node").join("node.exe")
        } else {
            runtime_dir.join("node").join("bin").join("node")
        };
        let prod_main = runtime_dir.join("api").join("dist").join("main.js");

        if prod_node.exists() && prod_main.exists() {
            return Ok(BackendRuntime {
                node_bin: prod_node,
                main_script: prod_main,
                cwd: runtime_dir.join("api"),
            });
        }

        // Development: repository checkout with a system-installed Node.js.
        let project_root = paths::get_project_root();
        let dist_path = project_root.join("apps").join("api").join("dist").join("main.js");

        if !dist_path.exists() {
            return Err(format!(
                "Backend not built. Expected {:?}. Run 'pnpm --filter api build' first.",
                dist_path
            ));
        }

        let node_bin = which_node().ok_or("Node.js not found in PATH")?;

        Ok(BackendRuntime {
            node_bin: PathBuf::from(node_bin),
            main_script: dist_path,
            cwd: project_root,
        })
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

        let runtime = self.resolve_runtime()?;

        let db_path = paths::get_db_path();
        let log_dir = paths::ensure_data_dir()?;
        let log_path = log_dir.join("backend.log");
        let log_file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_path)
            .map_err(|e| format!("Failed to open backend log {:?}: {}", log_path, e))?;
        let log_stderr = log_file
            .try_clone()
            .map_err(|e| format!("Failed to clone backend log handle: {}", e))?;

        let child = Command::new(&runtime.node_bin)
            .arg(&runtime.main_script)
            .current_dir(&runtime.cwd)
            .env("NODE_ENV", "production")
            .env("PORT", PORT.to_string())
            .env("DATABASE_URL", format!("file:{}", db_path.display()))
            .env("LOCAL_MODE", "true")
            .stdout(file_to_stdio(log_file))
            .stderr(file_to_stdio(log_stderr))
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

        Ok(format!("Backend started with PID {} (log: {:?})", pid, log_path))
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

impl Drop for ProcessManager {
    fn drop(&mut self) {
        let mut child = match self.child.lock() {
            Ok(guard) => guard,
            Err(_) => return,
        };
        if let Some(ref mut proc) = *child {
            let _ = proc.kill();
            let _ = proc.wait();
        }
    }
}

// Convert an open File into a child Stdio handle without a pipe (cross-platform).
// Redirecting the backend's stdout/stderr to a log file avoids the pipe-deadlock
// risk of an undrained Stdio::piped() and keeps backend logs for diagnosis.
fn file_to_stdio(file: File) -> Stdio {
    #[cfg(unix)]
    {
        use std::os::fd::OwnedFd;
        Stdio::from(OwnedFd::from(file))
    }
    #[cfg(not(unix))]
    {
        use std::os::windows::io::OwnedHandle;
        Stdio::from(OwnedHandle::from(file))
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

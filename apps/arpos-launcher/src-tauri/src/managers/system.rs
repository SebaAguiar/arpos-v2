use std::net::TcpStream;
use std::sync::Mutex;
use std::time::Duration;

use sysinfo::System;

pub struct SystemManager {
    system: Mutex<System>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct SystemInfo {
    pub os_name: String,
    pub os_version: String,
    pub host_name: String,
    pub cpu_count: usize,
    pub cpu_usage: f32,
    pub total_memory_mb: u64,
    pub used_memory_mb: u64,
    pub memory_usage_percent: f32,
    pub disk_total_gb: f64,
    pub disk_used_gb: f64,
    pub disk_usage_percent: f64,
}

impl SystemManager {
    pub fn new() -> Self {
        let mut system = System::new_all();
        system.refresh_all();
        Self {
            system: Mutex::new(system),
        }
    }

    pub fn get_info(&self) -> SystemInfo {
        let mut system = self.system.lock().unwrap();
        system.refresh_all();

        let cpu_usage = if system.cpus().is_empty() {
            0.0
        } else {
            let total: f32 = system.cpus().iter().map(|c| c.cpu_usage()).sum();
            total / system.cpus().len() as f32
        };

        let total_mem = system.total_memory();
        let used_mem = system.used_memory();
        let mem_percent = if total_mem > 0 {
            (used_mem as f64 / total_mem as f64) * 100.0
        } else {
            0.0
        };

        let (disk_total, disk_used) = get_disk_usage();
        let disk_percent = if disk_total > 0.0 {
            (disk_used / disk_total) * 100.0
        } else {
            0.0
        };

        SystemInfo {
            os_name: System::name().unwrap_or_else(|| "Unknown".to_string()),
            os_version: System::os_version().unwrap_or_else(|| "Unknown".to_string()),
            host_name: System::host_name().unwrap_or_else(|| "Unknown".to_string()),
            cpu_count: system.cpus().len(),
            cpu_usage,
            total_memory_mb: total_mem / 1024 / 1024,
            used_memory_mb: used_mem / 1024 / 1024,
            memory_usage_percent: mem_percent as f32,
            disk_total_gb: disk_total,
            disk_used_gb: disk_used,
            disk_usage_percent: disk_percent,
        }
    }

    pub fn get_cpu_usage(&self) -> f32 {
        let mut system = self.system.lock().unwrap();
        system.refresh_cpu();
        if system.cpus().is_empty() {
            return 0.0;
        }
        let total: f32 = system.cpus().iter().map(|c| c.cpu_usage()).sum();
        total / system.cpus().len() as f32
    }

    pub fn is_online() -> bool {
        const HOSTS: &[&str] = &[
            "1.1.1.1:80",
            "8.8.8.8:80",
            "google.com:80",
        ];
        for host in HOSTS {
            if TcpStream::connect_timeout(
                &host.parse().unwrap(),
                Duration::from_secs(2),
            )
            .is_ok()
            {
                return true;
            }
        }
        false
    }

    pub fn get_memory_usage(&self) -> (u64, u64, f32) {
        let mut system = self.system.lock().unwrap();
        system.refresh_memory();
        let total = system.total_memory() / 1024 / 1024;
        let used = system.used_memory() / 1024 / 1024;
        let percent = if total > 0 {
            (used as f32 / total as f32) * 100.0
        } else {
            0.0
        };
        (total, used, percent)
    }
}

fn get_disk_usage() -> (f64, f64) {
    let home = dirs::home_dir().unwrap_or_default();
    let disks = sysinfo::Disks::new_with_refreshed_list();

    for disk in disks.list() {
        if home.starts_with(disk.mount_point()) {
            let total = disk.total_space() as f64 / 1024.0 / 1024.0 / 1024.0;
            let available = disk.available_space() as f64 / 1024.0 / 1024.0 / 1024.0;
            let used = total - available;
            return (total, used);
        }
    }

    (0.0, 0.0)
}

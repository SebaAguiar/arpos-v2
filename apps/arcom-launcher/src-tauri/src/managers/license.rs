use std::fs;

use crate::utils::paths;

/// Stores the device identity used for license issuance.
///
/// The whole identity (device id + PKCS#8 private key) is persisted as one
/// opaque JSON blob owned by the frontend. Rust stays out of the serialization
/// format so the key material can be rotated or re-shaped without touching the
/// desktop layer.
///
/// SECURITY NOTE (interim, deliberately honest):
/// This is a plaintext file in `~/.arcom/data/`, created with 0600 permissions
/// on Unix. That is strictly better than the previous arrangement (the license
/// token was world-readable at 0644) and it is enough to defeat the threat
/// that actually applies today: script running on the page (XSS) reaching the
/// key through localStorage.
///
/// It is NOT a real keychain. A process running as the same OS user can still
/// read it. The proper fix is a Tauri keyring/stronghold plugin, deliberately
/// deferred because it adds a build-time dependency on every target platform
/// (Linux headless included) and must be validated against the release
/// pipeline first. Do not add new secrets to this file until that migration.
const DEVICE_IDENTITY_FILE: &str = "device.identity.json";

pub struct LicenseManager;

impl LicenseManager {
    pub fn new() -> Self {
        Self
    }

    pub fn get_token_path() -> std::path::PathBuf {
        paths::get_data_dir().join("license.token")
    }

    pub fn get_device_identity_path() -> std::path::PathBuf {
        paths::get_data_dir().join(DEVICE_IDENTITY_FILE)
    }

    pub fn get_token(&self) -> Result<Option<String>, String> {
        let path = Self::get_token_path();
        if !path.exists() {
            return Ok(None);
        }
        let contents = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read license token: {}", e))?;
        let trimmed = contents.trim();
        if trimmed.is_empty() {
            return Ok(None);
        }
        Ok(Some(trimmed.to_string()))
    }

    pub fn save_token(&self, token: &str) -> Result<(), String> {
        if token.trim().is_empty() {
            return Err("License token is empty".to_string());
        }
        let dir = paths::ensure_data_dir()?;
        let path = dir.join("license.token");
        fs::write(&path, token.trim())
            .map_err(|e| format!("Failed to write license token: {}", e))?;
        Ok(())
    }

    pub fn clear_token(&self) -> Result<(), String> {
        let path = Self::get_token_path();
        if path.exists() {
            fs::remove_file(&path)
                .map_err(|e| format!("Failed to remove license token: {}", e))?;
        }
        Ok(())
    }

    /// Reads the persisted device identity blob (JSON owned by the frontend).
    /// Returns `None` on a fresh install, which is the signal to generate a
    /// new keypair.
    pub fn get_device_identity(&self) -> Result<Option<String>, String> {
        let path = Self::get_device_identity_path();
        if !path.exists() {
            return Ok(None);
        }
        let contents = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read device identity: {}", e))?;
        let trimmed = contents.trim();
        if trimmed.is_empty() {
            return Ok(None);
        }
        Ok(Some(trimmed.to_string()))
    }

    pub fn save_device_identity(&self, identity_json: &str) -> Result<(), String> {
        if identity_json.trim().is_empty() {
            return Err("Device identity is empty".to_string());
        }
        let dir = paths::ensure_data_dir()?;
        let path = dir.join(DEVICE_IDENTITY_FILE);
        fs::write(&path, identity_json.trim())
            .map_err(|e| format!("Failed to write device identity: {}", e))?;
        restrict_permissions(&path)?;
        Ok(())
    }

    pub fn clear_device_identity(&self) -> Result<(), String> {
        let path = Self::get_device_identity_path();
        if path.exists() {
            fs::remove_file(&path)
                .map_err(|e| format!("Failed to remove device identity: {}", e))?;
        }
        Ok(())
    }
}

/// Owner-only permissions on Unix; a no-op elsewhere so Windows keeps working.
#[cfg(unix)]
fn restrict_permissions(path: &std::path::Path) -> Result<(), String> {
    use std::os::unix::fs::PermissionsExt;

    fs::set_permissions(path, fs::Permissions::from_mode(0o600))
        .map_err(|e| format!("Failed to restrict device key permissions: {}", e))
}

#[cfg(not(unix))]
fn restrict_permissions(_path: &std::path::Path) -> Result<(), String> {
    Ok(())
}

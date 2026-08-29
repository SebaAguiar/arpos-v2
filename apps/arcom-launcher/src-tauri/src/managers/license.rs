use std::fs;

use crate::utils::paths;

const TOKEN_FILE: &str = "license.token";

pub struct LicenseManager;

impl LicenseManager {
    pub fn new() -> Self {
        Self
    }

    pub fn get_token_path() -> std::path::PathBuf {
        paths::get_data_dir().join(TOKEN_FILE)
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
        let path = dir.join(TOKEN_FILE);
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
}

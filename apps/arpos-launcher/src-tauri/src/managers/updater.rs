use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub available: bool,
    pub version: String,
    pub notes: Option<String>,
    pub published_at: Option<String>,
    pub download_url: Option<String>,
}

pub struct UpdaterManager {
    client: reqwest::Client,
}

impl UpdaterManager {
    pub fn new() -> Self {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()
            .unwrap_or_default();

        Self { client }
    }

    pub async fn check_for_updates(&self, current_version: &str) -> Result<UpdateInfo, String> {
        let url = format!(
            "https://api.github.com/repos/{}/releases/latest",
            get_repo_owner_name()
        );

        let response = self
            .client
            .get(&url)
            .header("User-Agent", format!("arpos-updater/{}", current_version))
            .send()
            .await
            .map_err(|e| format!("Failed to check for updates: {}", e))?;

        if !response.status().is_success() {
            return Ok(UpdateInfo {
                available: false,
                version: current_version.to_string(),
                notes: None,
                published_at: None,
                download_url: None,
            });
        }

        let release: GitHubRelease = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse release info: {}", e))?;

        let latest_version = release.tag_name.trim_start_matches('v');
        let available = latest_version != current_version;

        let download_url = release
            .assets
            .iter()
            .find(|a| {
                let name = a.name.to_lowercase();
                (cfg!(target_os = "windows") && name.ends_with(".msi"))
                    || (cfg!(target_os = "macos") && name.ends_with(".dmg"))
                    || (cfg!(target_os = "linux") && name.ends_with(".appimage"))
            })
            .map(|a| a.browser_download_url.clone());

        Ok(UpdateInfo {
            available,
            version: latest_version.to_string(),
            notes: release.body,
            published_at: release.published_at,
            download_url,
        })
    }

    pub async fn download_update(
        &self,
        url: &str,
        dest_path: &str,
    ) -> Result<String, String> {
        let response = self
            .client
            .get(url)
            .send()
            .await
            .map_err(|e| format!("Failed to start download: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Download failed with status: {}", response.status()));
        }

        let bytes = response
            .bytes()
            .await
            .map_err(|e| format!("Failed to read download: {}", e))?;

        std::fs::write(dest_path, &bytes)
            .map_err(|e| format!("Failed to write update file: {}", e))?;

        Ok(dest_path.to_string())
    }
}

#[derive(Debug, Deserialize)]
struct GitHubRelease {
    tag_name: String,
    body: Option<String>,
    published_at: Option<String>,
    assets: Vec<GitHubAsset>,
}

#[derive(Debug, Deserialize)]
struct GitHubAsset {
    name: String,
    browser_download_url: String,
}

fn get_repo_owner_name() -> String {
    option_env!("GITHUB_REPO")
        .unwrap_or("SebaAguiar/arpos-v2")
        .to_string()
}

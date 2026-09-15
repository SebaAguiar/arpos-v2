fn main() {
    let manifest_dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
    for resource in ["../../../runtime/node", "../../../runtime/api"] {
        let _ = std::fs::create_dir_all(manifest_dir.join(resource));
    }
    tauri_build::build()
}

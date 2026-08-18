declare module '*.json' {
  const value: {
    version: string;
    githubUrl: string;
    assets: {
      windows_msi: string;
      windows_exe: string;
      macos_dmg: string;
      linux_appimage: string;
      linux_deb: string;
      linux_rpm: string;
    };
  };
  export default value;
}

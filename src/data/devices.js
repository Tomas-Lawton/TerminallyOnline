export const DEVICES = {
  mac: { label: "macOS", icon: "⌘", note: "Unix native. Use Terminal or iTerm2.", tip: "On Mac, use brew to install tools: brew install tmux htop tree" },
  linux: { label: "Linux", icon: "⟩", note: "Native environment. Everything runs directly.", tip: "On Ubuntu/Debian use apt, on Fedora/RHEL use dnf." },
  windows: { label: "Windows", icon: "⊞", note: "Install WSL2 first, then everything works.", tip: "Run 'wsl --install' in PowerShell as admin, then open Ubuntu from Start." },
};

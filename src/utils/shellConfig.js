const STORAGE_KEY = "tol_shell_config";

const DEFAULTS = {
  aliases: {},
  ps1: null,
  ps1Emoji: null,
  ps1Color: null,
  ps1ShowUser: true,
  ps1ShowHost: true,
  ps1DirMode: "full", // "full" or "basename"
  ps1ShowTime: false,
  lsColors: null,
  theme: null,
  font: null,
};

export function getShellConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveShellConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // localStorage unavailable
  }
}

export function updateShellConfig(updates) {
  const config = getShellConfig();
  Object.assign(config, updates);
  saveShellConfig(config);
  return config;
}

export function resetShellConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable
  }
}

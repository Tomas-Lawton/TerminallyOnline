const STORAGE_KEY = "terminallyonline_progress";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable
  }
}

export function getProgress() {
  const data = load();
  if (!data) return { done: [], totalCommands: 0, days: [], stepProgress: {} };
  return {
    done: data.done || [],
    totalCommands: data.totalCommands || 0,
    days: data.days || [],
    stepProgress: data.stepProgress || {},
  };
}

export function saveProgress(doneSet, totalCommands) {
  const prev = load() || { days: [] };
  const today = new Date().toISOString().slice(0, 10);
  const days = prev.days || [];
  if (!days.includes(today)) days.push(today);
  save({
    done: [...doneSet],
    totalCommands,
    days,
    stepProgress: prev.stepProgress || {},
  });
}

export function saveStepProgress(chapterIdx, stepIdx) {
  const prev = load() || {};
  const stepProgress = prev.stepProgress || {};
  stepProgress[chapterIdx] = stepIdx;
  prev.stepProgress = stepProgress;
  save(prev);
}

export function getStepProgress(chapterIdx) {
  const data = load();
  if (!data || !data.stepProgress) return 0;
  return data.stepProgress[chapterIdx] || 0;
}

export function recordCommand() {
  const prev = load() || { done: [], totalCommands: 0, days: [] };
  const today = new Date().toISOString().slice(0, 10);
  const days = prev.days || [];
  if (!days.includes(today)) days.push(today);
  prev.totalCommands = (prev.totalCommands || 0) + 1;
  prev.days = days;
  save(prev);
  return prev.totalCommands;
}

export function getStreak() {
  const data = load();
  if (!data || !data.days || data.days.length === 0) return 0;
  const sorted = [...data.days].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Streak must include today or yesterday
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (prev - curr) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export function getTotalCommands() {
  const data = load();
  return data?.totalCommands || 0;
}

export function resetAllProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("tol_sections_done");
    localStorage.removeItem("tol_cert_shown");
    localStorage.removeItem("tol_onboarded");
  } catch {
    // localStorage unavailable
  }
}

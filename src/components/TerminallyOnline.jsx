import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { CHAPTERS } from "@/data/chapters";
import { DEVICES } from "@/data/devices";
import { norm } from "@/utils/helpers";
import { getProgress, saveProgress, recordCommand, saveStepProgress, getStepProgress } from "@/utils/progress";
import LandingScreen from "./screens/LandingScreen";
import SetupScreen from "./screens/SetupScreen";
import MenuScreen from "./screens/MenuScreen";

export default function TerminallyOnline() {
  const [device, setDevice] = useState(null);
  const [screen, setScreen] = useState("landing");
  const [chIdx, setChIdx] = useState(0);
  const [stIdx, setStIdx] = useState(0);
  const [maxStIdx, setMaxStIdx] = useState(0);
  const [input, setInput] = useState("");
  const [hist, setHist] = useState([]);
  const [done, setDone] = useState(() => {
    const progress = getProgress();
    return progress.done.length > 0 ? new Set(progress.done) : new Set();
  });
  const [hint, setHint] = useState(false);
  const [shake, setShake] = useState(false);
  const [cmdH, setCmdH] = useState([]);
  const [cmdI, setCmdI] = useState(-1);
  const [showInfo, setShowInfo] = useState(false);
  const [navIdx, setNavIdx] = useState(0);
  const [mob, setMob] = useState(false);
  const [cwd, setCwd] = useState("/home/ubuntu");
  const autoSubmitRef = useRef(false);

  // Save progress when done changes
  useEffect(() => {
    if (done.size > 0) {
      saveProgress(done, getProgress().totalCommands);
    }
  }, [done]);

  const [prevScreen, setPrevScreen] = useState(screen);
  useEffect(() => { const c = () => setMob(window.innerWidth < 640); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);

  // Reset nav index when screen changes (derived state pattern)
  if (screen !== prevScreen) {
    setPrevScreen(screen);
    setNavIdx(0);
  }

  const menuItems = useMemo(() => {
    const items = [];
    const groups = [
      { ids: ["basics", "files", "perm", "read", "pipe", "tools"] },
      { ids: ["sys", "git", "ssh"] },
      { ids: ["docker", "nginx", "boss"] },
      { ids: ["ai"] },
    ];
    groups.forEach(g => g.ids.forEach(id => {
      const ci = CHAPTERS.findIndex(c => c.id === id);
      if (ci >= 0) items.push({ type: "chapter", idx: ci });
    }));
    items.push({ type: "sandbox" });
    return items;
  }, []);

  const startCh = useCallback(i => {
    const savedStep = getStepProgress(i);
    setChIdx(i);
    setStIdx(savedStep);
    setMaxStIdx(savedStep);
    setHist([]);
    setHint(false);
    setInput("");
    setCmdH([]);
    setCmdI(-1);
    setCwd("/home/ubuntu");
    setScreen("lesson");
  }, []);

  // Global keyboard handler
  useEffect(() => {
    const deviceKeys = Object.keys(DEVICES);
    const handler = (e) => {
      if (showInfo) { if (e.key === "Escape") setShowInfo(false); return; }

      if (screen === "landing") {
        if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); setNavIdx(i => Math.min(i + 1, deviceKeys.length - 1)); }
        else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); setNavIdx(i => Math.max(i - 1, 0)); }
        else if (e.key === "Enter") { e.preventDefault(); setDevice(deviceKeys[navIdx]); setScreen("setup"); }
        else if (e.key === "1") { setDevice("mac"); setScreen("setup"); }
        else if (e.key === "2") { setDevice("linux"); setScreen("setup"); }
        else if (e.key === "3") { setDevice("windows"); setScreen("setup"); }
        else if (e.key === "?") setShowInfo(true);
      }

      else if (screen === "setup") {
        if (e.key === "Enter") { e.preventDefault(); setScreen("menu"); }
        else if (e.key === "Escape" || e.key === "Backspace") setScreen("landing");
      }

      else if (screen === "menu") {
        if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); setNavIdx(i => Math.min(i + 1, menuItems.length - 1)); }
        else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); setNavIdx(i => Math.max(i - 1, 0)); }
        else if (e.key === "Enter") {
          e.preventDefault();
          const item = menuItems[navIdx];
          if (item.type === "sandbox") setScreen("sandbox");
          else startCh(item.idx);
        }
        else if (e.key >= "1" && e.key <= "9") {
          const idx = parseInt(e.key) - 1;
          if (idx < CHAPTERS.length) startCh(idx);
        }
        else if (e.key === "0") setScreen("sandbox");
        else if (e.key === "?" || e.key === "i") setShowInfo(true);
        else if (e.key === "Escape" || e.key === "Backspace") setScreen("setup");
      }

      else if (screen === "sandbox") {
        if (e.key === "Escape") { setScreen("menu"); e.preventDefault(); }
      }

      else if (screen === "lesson") {
        if (e.key === "Escape") {
          e.preventDefault();
          saveStepProgress(chIdx, stIdx);
          setScreen("menu");
          setHist([]);
          setHint(false);
          setInput("");
        }
        if (e.ctrlKey && e.key === 'z') {
          e.preventDefault();
        }
        if (e.ctrlKey && e.key === 'c') {
          e.preventDefault();
        }
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, navIdx, showInfo, menuItems, startCh, chIdx, stIdx]);

  const ch = CHAPTERS[chIdx];
  const st = ch?.steps[stIdx];
  const lessonDone = stIdx >= (ch?.steps.length || 0);

  const resolveCd = useCallback((cmd) => {
    const match = cmd.match(/^cd\s+(.+)/);
    if (!match) return null;
    const target = match[1].replace(/\/+$/, "");
    if (target === "~" || target === "") return "/home/ubuntu";
    if (target === "-") return cwd; // simplified: just stay
    if (target === "..") {
      const parts = cwd.split("/").filter(Boolean);
      parts.pop();
      return "/" + parts.join("/") || "/";
    }
    if (target === "../..") {
      const parts = cwd.split("/").filter(Boolean);
      parts.pop(); parts.pop();
      return "/" + parts.join("/") || "/";
    }
    if (target.startsWith("/")) return target;
    if (target.startsWith("./")) return cwd === "/" ? "/" + target.slice(2) : cwd + "/" + target.slice(2);
    return cwd === "/" ? "/" + target : cwd + "/" + target;
  }, [cwd]);

  const go = useCallback(() => {
    if (lessonDone) return;
    const trimmed = input.trim();
    const ctrlStep = st?.accept?.some(a => /^ctrl\+/i.test(a));

    // Block all non-Ctrl input during Ctrl steps (process is "running")
    if (ctrlStep && !/^ctrl\+/i.test(trimmed)) { setInput(""); return; }

    // Empty enter — just show a blank prompt line like a real terminal
    if (!trimmed) { setHist(h => [...h, { t: "in", v: "", dir: cwd }]); setInput(""); return; }

    const c = norm(input);

    if (c === "help") { setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, { t: "help" }]); setInput(""); return; }
    if (c === "clear") {
      // If the current step expects "clear", advance the step too
      const clearOk = st && st.accept && st.accept.some(a => norm(a) === "clear");
      if (clearOk) {
        setHist(st.note ? [{ t: "note", v: st.note }] : []);
        setHint(false); setInput("");
        const nx = stIdx + 1;
        if (nx >= ch.steps.length) { setDone(d => new Set([...d, chIdx])); setHist(h => [...h, { t: "done", v: ch.title }]); }
        setStIdx(nx);
        setMaxStIdx(m => Math.max(m, nx));
        saveStepProgress(chIdx, nx);
      } else {
        setHist([]); setInput("");
      }
      return;
    }

    if (c === "skip") {
      // If the skipped step is a cd command, update cwd based on the hint
      const skipDir = resolveCd(norm(st.hint));
      if (skipDir) setCwd(skipDir);
      setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, ...(st.output ? [{ t: "out", v: st.output }] : []), { t: "note", v: `(skipped) ${st.note}` }]);
      setHint(false); setInput("");
      const nx = stIdx + 1;
      if (nx >= ch.steps.length) { setDone(d => new Set([...d, chIdx])); setHist(h => [...h, { t: "done", v: ch.title }]); }
      setStIdx(nx);
      setMaxStIdx(m => Math.max(m, nx));
      saveStepProgress(chIdx, nx);
      return;
    }

    // Check if it matches the current step first
    const ok = st.accept.some(a => norm(a) === c);
    setCmdH(h => [trimmed, ...h]); setCmdI(-1);
    recordCommand();

    if (ok) {
      const newDir = resolveCd(c);
      if (newDir) setCwd(newDir);
      setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, ...(st.output ? [{ t: "out", v: st.output }] : []), { t: "note", v: st.note }]);
      setHint(false); setInput("");
      const nx = stIdx + 1;
      if (nx >= ch.steps.length) { setDone(d => new Set([...d, chIdx])); setHist(h => [...h, { t: "done", v: ch.title }]); }
      setStIdx(nx);
      setMaxStIdx(m => Math.max(m, nx));
      saveStepProgress(chIdx, nx);
      return;
    }

    // Common commands always work — the terminal should feel real
    const common = {
      "pwd": cwd,
      "ls": "project  notes.md  scripts  .bashrc  .ssh",
      "ls -la": "drwxr-xr-x  5 ubuntu ubuntu 4096 Mar 18 22:15 .\n-rw-r--r--  1 ubuntu ubuntu 3771 Mar  5 14:00 .bashrc\ndrwxr-xr-x  2 ubuntu ubuntu 4096 Mar 10 09:30 .ssh\ndrwxr-xr-x  8 ubuntu ubuntu 4096 Mar 17 16:45 project\n-rw-r--r--  1 ubuntu ubuntu  120 Mar 15 11:20 notes.md",
      "ls -al": "drwxr-xr-x  5 ubuntu ubuntu 4096 Mar 18 22:15 .\n-rw-r--r--  1 ubuntu ubuntu 3771 Mar  5 14:00 .bashrc\ndrwxr-xr-x  2 ubuntu ubuntu 4096 Mar 10 09:30 .ssh\ndrwxr-xr-x  8 ubuntu ubuntu 4096 Mar 17 16:45 project\n-rw-r--r--  1 ubuntu ubuntu  120 Mar 15 11:20 notes.md",
      "ls -l": "drwxr-xr-x  5 ubuntu ubuntu 4096 Mar 18 22:15 .\n-rw-r--r--  1 ubuntu ubuntu 3771 Mar  5 14:00 .bashrc\ndrwxr-xr-x  2 ubuntu ubuntu 4096 Mar 10 09:30 .ssh\ndrwxr-xr-x  8 ubuntu ubuntu 4096 Mar 17 16:45 project\n-rw-r--r--  1 ubuntu ubuntu  120 Mar 15 11:20 notes.md",
      "ls -a": ".  ..  .bashrc  .ssh  project  notes.md  scripts",
      "ls -lah": "drwxr-xr-x  5 ubuntu ubuntu 4.0K Mar 18 22:15 .\n-rw-r--r--  1 ubuntu ubuntu 3.7K Mar  5 14:00 .bashrc\ndrwxr-xr-x  2 ubuntu ubuntu 4.0K Mar 10 09:30 .ssh\ndrwxr-xr-x  8 ubuntu ubuntu 4.0K Mar 17 16:45 project\n-rw-r--r--  1 ubuntu ubuntu  120 Mar 15 11:20 notes.md",
      "whoami": "ubuntu",
      "hostname": "gpu-box",
      "uname": "Linux",
      "uname -a": "Linux gpu-box 5.15.0-91-generic #101-Ubuntu SMP x86_64 GNU/Linux",
      "uname -r": "5.15.0-91-generic",
      "date": new Date().toUTCString(),
      "uptime": " 10:42:13 up 14 days, 3:22, 1 user, load average: 0.42, 0.38, 0.35",
      "id": "uid=1000(ubuntu) gid=1000(ubuntu) groups=1000(ubuntu),27(sudo),999(docker)",
      "which bash": "/usr/bin/bash",
      "which python": "/usr/bin/python3",
      "which python3": "/usr/bin/python3",
      "echo $home": "/home/ubuntu",
      "echo $user": "ubuntu",
      "echo $shell": "/bin/bash",
      "echo $path": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      "ps": "  PID TTY          TIME CMD\n12345 pts/0    00:00:00 bash\n12346 pts/0    00:00:00 ps",
      "ps aux": "ubuntu  12345  45.2  8.3 python train.py --epochs 50\nubuntu  12478   0.3  1.2 python inference.py --port 8000\nroot     1234   0.1  0.0 nginx: master process",
      "cat /etc/os-release": "NAME=\"Ubuntu\"\nVERSION=\"22.04.3 LTS (Jammy Jellyfish)\"\nID=ubuntu",
      "free -h": "              total    used    free   available\nMem:           61Gi   22.1Gi   30Gi      37Gi\nSwap:            0B      0B      0B",
      "df -h": "Filesystem      Size  Used Avail Use% Mounted on\n/dev/nvme0n1p1  200G   42G  158G  21% /",
      "ls --help": "Usage: ls [OPTION]... [FILE]...\nList directory contents.\n\n  -a    include hidden entries\n  -l    use long listing format\n  -h    human-readable sizes\n  -R    list recursively\n  -t    sort by modification time",
      "sudo whoami": "root",
      "git status": "On branch main\nnothing to commit, working tree clean",
      "git log": "a3f7b2c increase batch size\n8d1e4f2 add early stopping\nc7a9b3e fix memory leak",
      "git branch": "* main",
      "docker ps": "CONTAINER ID  IMAGE        STATUS     NAMES\na1b2c3d4e5f6  mymodel:v2   Up 2 days  inference_api",
      "python --version": "Python 3.11.7",
      "python3 --version": "Python 3.11.7",
      "node --version": "v20.11.0",
      "bash --version": "GNU bash, version 5.2.15(1)-release",
    };

    // Handle echo with arbitrary text
    if (c.startsWith("echo ") && !common[c]) {
      const text = trimmed.replace(/^echo\s+/, "").replace(/^["']|["']$/g, "");
      setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, { t: "out", v: text }]);
      setInput("");
      return;
    }
    if (common[c]) {
      setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, { t: "out", v: common[c] }]);
      setInput("");
      return;
    }
    if (c === "history") {
      const histOutput = cmdH.slice().reverse().map((cmd, i) => `${i + 1}  ${cmd}`).join("\n") || "(no history yet)";
      setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, { t: "out", v: histOutput }]);
      setInput("");
      return;
    }

    // Handle cd — always works, updates cwd
    if (c.startsWith("cd")) {
      const newDir = resolveCd(c);
      if (newDir) setCwd(newDir);
      setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }]);
      setInput("");
      return;
    }

    // Check previous steps in the current chapter — user may re-run earlier commands
    for (let i = 0; i < stIdx; i++) {
      const prev = ch.steps[i];
      if (prev.accept.some(a => norm(a) === c)) {
        const newDir = resolveCd(c);
        if (newDir) setCwd(newDir);
        setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, ...(prev.output ? [{ t: "out", v: prev.output }] : [])]);
        setInput("");
        return;
      }
    }

    // Recognize valid commands that we can't simulate — give a friendly response
    const knownCmds = ["mkdir", "touch", "rm", "cp", "mv", "cat", "less", "head", "tail", "grep", "find",
      "chmod", "chown", "tar", "zip", "unzip", "nano", "vim", "vi", "man", "diff", "wc",
      "sort", "cut", "awk", "sed", "xargs", "tee", "kill", "htop", "top", "lsof", "du",
      "wget", "curl", "ping", "ssh", "scp", "rsync", "tmux", "docker", "git", "npm", "pip",
      "sudo", "apt", "brew", "dnf", "yum", "systemctl", "journalctl", "nginx", "nohup",
      "watch", "bg", "fg", "jobs", "alias", "source", "export", "env", "which", "ln",
      "zip", "unzip", "gzip", "gunzip", "make", "gcc", "python", "python3", "node", "bash"];
    const firstWord = c.split(/\s+/)[0];
    if (knownCmds.includes(firstWord)) {
      setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, { t: "out", v: `(simulated) ✓ valid command — but this step is asking for something else. Check the task on the left.` }]);
      setInput("");
      return;
    }

    // Unknown command
    setShake(true); setTimeout(() => setShake(false), 500);
    setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, { t: "err", v: `bash: ${firstWord}: command not found` }]);
    setInput("");
  }, [input, st, stIdx, ch, lessonDone, chIdx, cwd, resolveCd, cmdH]);

  const kd = (e, inRef) => {
    if (e.key === "Enter") { e.preventDefault(); go(); }
    if (e.key === "Tab") { e.preventDefault(); setHint(h => !h); }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      inRef?.current?.blur();
      saveStepProgress(chIdx, stIdx);
      setScreen("menu");
      setHist([]);
      setHint(false);
      setInput("");
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      autoSubmitRef.current = true;
      setInput('Ctrl+Z');
      return;
    }
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      autoSubmitRef.current = true;
      setInput('Ctrl+C');
      return;
    }
    if (e.key === "ArrowUp") { e.preventDefault(); if (cmdH.length) { const n = Math.min(cmdI + 1, cmdH.length - 1); setCmdI(n); setInput(cmdH[n]); } }
    if (e.key === "ArrowDown") { e.preventDefault(); if (cmdI > 0) { setCmdI(cmdI - 1); setInput(cmdH[cmdI - 1]); } else { setCmdI(-1); setInput(""); } }
  };

  // Auto-submit for Ctrl+Z/C
  useEffect(() => {
    if (autoSubmitRef.current) {
      autoSubmitRef.current = false;
      Promise.resolve().then(go);
    }
  }, [input, go]);

  const goBack = useCallback(() => {
    if (stIdx > 0) {
      setStIdx(stIdx - 1);
      setHint(false);
      setInput("");
    }
  }, [stIdx]);

  const goToStep = useCallback((idx) => {
    setStIdx(idx);
    setHint(false);
    setInput("");
  }, []);

  const restartCh = useCallback((i) => {
    setChIdx(i);
    setStIdx(0);
    setMaxStIdx(0);
    setHist([]);
    setHint(false);
    setInput("");
    setCmdH([]);
    setCmdI(-1);
    setCwd("/home/ubuntu");
    setScreen("lesson");
    saveStepProgress(i, 0);
  }, []);

  const exitLesson = useCallback(() => {
    saveStepProgress(chIdx, stIdx);
    setScreen("menu");
    setHist([]);
    setHint(false);
    setInput("");
  }, [chIdx, stIdx]);

  const skip = useCallback(() => {
    if (lessonDone || !st) return;
    const skipDir = resolveCd(norm(st.hint));
    if (skipDir) setCwd(skipDir);
    setHist(h => [...h, { t: "in", v: "skip", dir: cwd }, ...(st.output ? [{ t: "out", v: st.output }] : []), { t: "note", v: `(skipped) ${st.note}` }]);
    setHint(false); setInput("");
    const nx = stIdx + 1;
    if (nx >= ch.steps.length) { setDone(d => new Set([...d, chIdx])); setHist(h => [...h, { t: "done", v: ch.title }]); }
    setStIdx(nx);
    setMaxStIdx(m => Math.max(m, nx));
    saveStepProgress(chIdx, nx);
  }, [st, stIdx, ch, lessonDone, chIdx, resolveCd]);

  if (screen === "landing") return (
    <LandingScreen mob={mob} navIdx={navIdx} setNavIdx={setNavIdx} setDevice={setDevice} setScreen={setScreen} showInfo={showInfo} setShowInfo={setShowInfo} setDone={setDone} />
  );

  if (screen === "setup") return (
    <SetupScreen mob={mob} device={device} setScreen={setScreen} />
  );

  return (
    <MenuScreen
      mob={mob} device={device} done={done} navIdx={navIdx} setNavIdx={setNavIdx}
      startCh={startCh} setScreen={setScreen} showInfo={showInfo} setShowInfo={setShowInfo}
      lessonActive={screen === "lesson"}
      sandboxActive={screen === "sandbox"}
      chIdx={chIdx} stIdx={stIdx} maxStIdx={maxStIdx} hist={hist} hint={hint} shake={shake}
      input={input} setInput={setInput} kd={kd}
      cwd={cwd}
      goBack={goBack}
      goToStep={goToStep}
      exitLesson={exitLesson}
      skip={skip}
      restartCh={restartCh}
      setDone={setDone}
    />
  );
}

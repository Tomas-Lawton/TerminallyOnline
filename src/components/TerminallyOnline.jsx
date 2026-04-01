import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { CHAPTERS } from "@/data/chapters";
import { DEVICES } from "@/data/devices";
import { MAN_PAGES } from "@/data/manpages";
import { norm } from "@/utils/helpers";
import { getProgress, saveProgress, recordCommand, saveStepProgress, getStepProgress, getTotalCommands } from "@/utils/progress";
import { getShellConfig, updateShellConfig } from "@/utils/shellConfig";
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
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("tol_onboarded"));
  const [navIdx, setNavIdx] = useState(0);
  const [mob, setMob] = useState(false);
  const [cwd, setCwd] = useState("/home/ubuntu");
  const [shellConfig, setShellConfig] = useState(() => getShellConfig());
  const [vanishMode, setVanishMode] = useState(false); // Beat 5: simulates new session
  const [completedSteps, setCompletedSteps] = useState(new Set()); // Challenge mode: non-linear step tracking
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
      { ids: ["basics", "files", "perm", "custom", "read", "pipe", "tools"] },
      { ids: ["sys", "git", "ssh", "docker", "nginx", "boss"] },
      { ids: ["ch-deploy", "ch-debug", "ch-lockdown"] },
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
    setCompletedSteps(new Set());
    setVanishMode(false);
    setScreen("lesson");
  }, []);

  // Global keyboard handler
  useEffect(() => {
    const deviceKeys = Object.keys(DEVICES);
    const handler = (e) => {
      if (showOnboarding && screen === "menu") { if (e.key === "Escape" || e.key === "Enter") { e.preventDefault(); localStorage.setItem("tol_onboarded", "1"); setShowOnboarding(false); } return; }
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
        else if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); const el = document.querySelector("[data-setup-scroll]"); if (el) el.scrollBy({ top: 120, behavior: "smooth" }); }
        else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); const el = document.querySelector("[data-setup-scroll]"); if (el) el.scrollBy({ top: -120, behavior: "smooth" }); }
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
  }, [screen, navIdx, showInfo, showOnboarding, menuItems, startCh, chIdx, stIdx]);

  const ch = CHAPTERS[chIdx];
  const st = ch?.steps[stIdx];
  const lessonDone = stIdx >= (ch?.steps.length || 0);

  // Activate vanish mode when entering the "vanishing trick" step in custom chapter
  useEffect(() => {
    if (ch?.id === "custom" && st?.output === "__vanish_fail__" && !vanishMode) {
      setVanishMode(true); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [ch?.id, st?.output]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const go = useCallback((overrideInput) => {
    const trimmed = (overrideInput !== undefined ? overrideInput : input).trim();

    if (!lessonDone) {
      const ctrlStep = st?.accept?.some(a => /^ctrl\+/i.test(a));

      // Block all non-Ctrl input during Ctrl steps (process is "running")
      if (ctrlStep && !/^ctrl\+/i.test(trimmed)) { setInput(""); return; }
    }

    // Empty enter — just show a blank prompt line like a real terminal
    if (!trimmed) { setHist(h => [...h, { t: "in", v: "", dir: cwd }]); setInput(""); return; }

    const c = norm(trimmed);
    const firstWord = c.split(/\s+/)[0];

    if (c === "help") { setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, { t: "help" }]); setInput(""); return; }
    if (c === "sudo complete-all") {
      const allDone = new Set(CHAPTERS.map((_, i) => i));
      setDone(allDone);
      saveProgress(allDone, getTotalCommands());
      CHAPTERS.forEach((_, i) => saveStepProgress(i, CHAPTERS[i].steps.length));
      setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, { t: "note", v: "All chapters marked as complete." }]);
      setInput("");
      setScreen("menu");
      return;
    }
    if (c === "clear") {
      if (!lessonDone) {
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
          return;
        }
      }
      setHist([]); setInput("");
      return;
    }

    if (!lessonDone && c === "skip") {
      if (ch.mode === "challenge") {
        // Challenge mode: skip the first uncompleted step
        const skipIdx = ch.steps.findIndex((_, i) => !completedSteps.has(i));
        if (skipIdx >= 0) {
          const skipStep = ch.steps[skipIdx];
          const skipDir = resolveCd(norm(skipStep.hint));
          if (skipDir) setCwd(skipDir);
          const newCompleted = new Set([...completedSteps, skipIdx]);
          setCompletedSteps(newCompleted);
          setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, ...(skipStep.output ? [{ t: "out", v: skipStep.output }] : []), { t: "note", v: `(skipped) ${skipStep.note}` }]);
          setHint(false); setInput("");
          if (newCompleted.size >= ch.steps.length) {
            setDone(d => new Set([...d, chIdx]));
            setHist(h => [...h, { t: "done", v: ch.title }]);
          }
          setStIdx(skipIdx + 1);
          setMaxStIdx(m => Math.max(m, skipIdx + 1));
          saveStepProgress(chIdx, newCompleted.size);
        }
        return;
      }
      // Guided mode: skip the current step
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

    // Challenge mode: check against ALL uncompleted steps
    if (!lessonDone && ch.mode === "challenge") {
      setCmdH(h => [trimmed, ...h]); setCmdI(-1);
      recordCommand();
      let matchIdx = -1;
      for (let i = 0; i < ch.steps.length; i++) {
        if (completedSteps.has(i)) continue;
        if (ch.steps[i].accept.some(a => norm(a) === c)) { matchIdx = i; break; }
      }
      // Handle "solution" command — reveals current focused step's hint
      if (c === "solution") {
        // Find first uncompleted step
        const nextUncompleted = ch.steps.findIndex((_, i) => !completedSteps.has(i));
        if (nextUncompleted >= 0) {
          setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, { t: "out", v: `💡 Solution: ${ch.steps[nextUncompleted].hint}` }]);
        }
        setInput("");
        return;
      }
      if (matchIdx >= 0) {
        const matchedStep = ch.steps[matchIdx];
        const newDir = resolveCd(c);
        if (newDir) setCwd(newDir);
        const newCompleted = new Set([...completedSteps, matchIdx]);
        setCompletedSteps(newCompleted);
        setHist(h => [...h, { t: "in", v: trimmed, dir: cwd },
          ...(matchedStep.output ? [{ t: "out", v: matchedStep.output }] : []),
          { t: "note", v: matchedStep.note }]);
        setHint(false); setInput("");
        if (newCompleted.size >= ch.steps.length) {
          setDone(d => new Set([...d, chIdx]));
          setHist(h => [...h, { t: "done", v: ch.title }]);
        }
        setStIdx(matchIdx + 1);
        setMaxStIdx(m => Math.max(m, matchIdx + 1));
        saveStepProgress(chIdx, newCompleted.size);
        return;
      }
      // No match — check if it's a completed step being replayed, or an exploratory command
      for (let i = 0; i < ch.steps.length; i++) {
        if (!completedSteps.has(i)) continue;
        if (ch.steps[i].accept.some(a => norm(a) === c)) {
          const newDir = resolveCd(c);
          if (newDir) setCwd(newDir);
          setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, ...(ch.steps[i].output ? [{ t: "out", v: ch.steps[i].output }] : [])]);
          setInput("");
          return;
        }
      }
      // Challenge-specific exploratory commands
      const challengeCommon = {};
      if (ch.id === "ch-deploy") {
        const cloned = completedSteps.has(0);
        const inWebapp = cwd.endsWith("/webapp") || cwd.endsWith("/webapp/");
        challengeCommon["ls"] = cloned
          ? (inWebapp ? "dist  node_modules  package.json  src  vite.config.js" : "webapp")
          : "(empty)";
        challengeCommon["ls -la"] = cloned
          ? (inWebapp
            ? "drwxr-xr-x 12 ubuntu ubuntu 4096 Mar 18 22:15 .\ndrwxr-xr-x  3 ubuntu ubuntu 4096 Mar 18 22:00 ..\ndrwxr-xr-x  8 ubuntu ubuntu 4096 Mar 18 22:15 dist\ndrwxr-xr-x 42 ubuntu ubuntu 4096 Mar 18 22:15 node_modules\n-rw-r--r--  1 ubuntu ubuntu  312 Mar 18 22:15 package.json\ndrwxr-xr-x  4 ubuntu ubuntu 4096 Mar 18 22:15 src\n-rw-r--r--  1 ubuntu ubuntu  142 Mar 18 22:15 vite.config.js"
            : "drwxr-xr-x  3 ubuntu ubuntu 4096 Mar 18 22:15 .\ndrwxr-xr-x  3 ubuntu ubuntu 4096 Mar 18 22:00 ..\ndrwxr-xr-x 12 ubuntu ubuntu 4096 Mar 18 22:15 webapp")
          : "drwxr-xr-x  2 ubuntu ubuntu 4096 Mar 18 22:00 .\ndrwxr-xr-x  3 ubuntu ubuntu 4096 Mar 18 22:00 ..";
        challengeCommon["ls webapp"] = "dist  node_modules  package.json  src  vite.config.js";
        challengeCommon["ls dist"] = "index.html  assets";
        challengeCommon["cat package.json"] = '{\n  "name": "acme-webapp",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build",\n    "preview": "vite preview"\n  },\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  },\n  "devDependencies": {\n    "vite": "^5.2.0"\n  }\n}';
        challengeCommon["cat vite.config.js"] = "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n  build: { outDir: 'dist' }\n})";
        challengeCommon["cat /etc/nginx/sites-available/default"] = "server {\n    listen 80;\n    server_name _;\n    root /home/ubuntu/webapp/dist;\n    index index.html;\n\n    location / {\n        try_files $uri $uri/ /index.html;\n    }\n}";
        challengeCommon["cat /etc/nginx/sites-enabled/default"] = challengeCommon["cat /etc/nginx/sites-available/default"];
        challengeCommon["cat /etc/nginx/nginx.conf"] = "user www-data;\nworker_processes auto;\npid /run/nginx.pid;\n\nevents {\n    worker_connections 768;\n}\n\nhttp {\n    include /etc/nginx/sites-enabled/*;\n}";
        challengeCommon["ls /etc/nginx"] = "nginx.conf  sites-available  sites-enabled  mime.types";
        challengeCommon["ls /etc/nginx/sites-available"] = "default";
        challengeCommon["ls /etc/nginx/sites-enabled"] = "default";
      }
      if (ch.id === "ch-debug") {
        challengeCommon["ls"] = "api  docker-compose.yml  nginx.conf";
        challengeCommon["ls -la"] = "drwxr-xr-x  4 ubuntu ubuntu 4096 Mar 18 22:15 .\ndrwxr-xr-x  3 ubuntu ubuntu 4096 Mar 18 22:00 ..\ndrwxr-xr-x  3 ubuntu ubuntu 4096 Mar 17 16:45 api\n-rw-r--r--  1 ubuntu ubuntu  312 Mar 16 14:00 docker-compose.yml\n-rw-r--r--  1 ubuntu ubuntu  198 Mar 16 14:00 nginx.conf";
        challengeCommon["free -h"] = "              total    used    free   available\nMem:           61Gi   55.2Gi   2.1Gi      3.8Gi\nSwap:          2.0Gi   1.8Gi   0.2Gi";
        challengeCommon["cat docker-compose.yml"] = "version: '3'\nservices:\n  api:\n    image: api:v3\n    ports:\n      - '8080:8080'\n    restart: unless-stopped\n  redis:\n    image: redis:7\n    restart: always";
        challengeCommon["cat nginx.conf"] = "upstream api {\n    server 127.0.0.1:8080;\n}\n\nserver {\n    listen 80;\n    location /api/ {\n        proxy_pass http://api/;\n    }\n}";
        challengeCommon["ls api"] = "Dockerfile  app.py  requirements.txt";
        challengeCommon["cat api/Dockerfile"] = "FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nCMD [\"python\", \"app.py\"]";
      }
      if (ch.id === "ch-lockdown") {
        challengeCommon["ls"] = "deploy.sh  .env  app  docker-compose.yml";
        challengeCommon["ls -la"] = "drwxr-xr-x  5 ubuntu ubuntu 4096 Mar 18 22:15 .\ndrwxr-xr-x  3 ubuntu ubuntu 4096 Mar 18 22:00 ..\n-rwxrwxrwx  1 ubuntu ubuntu  842 Mar 15 10:00 deploy.sh\n-rw-rw-rw-  1 ubuntu ubuntu  256 Mar 15 10:00 .env\ndrwxr-xr-x  4 ubuntu ubuntu 4096 Mar 17 16:45 app\n-rw-r--r--  1 ubuntu ubuntu  512 Mar 16 14:00 docker-compose.yml\ndrwx------  2 ubuntu ubuntu 4096 Mar 10 09:30 .ssh";
        challengeCommon["ls -la ~/.ssh"] = "-rw-rw-rw-  1 ubuntu ubuntu 3243 Mar 10 09:30 id_rsa\n-rw-r--r--  1 ubuntu ubuntu  742 Mar 10 09:30 id_rsa.pub\n-rw-r--r--  1 ubuntu ubuntu  222 Mar 15 09:01 authorized_keys";
        challengeCommon["ls ~/.ssh"] = "id_rsa  id_rsa.pub  authorized_keys";
        challengeCommon["ls .ssh"] = "id_rsa  id_rsa.pub  authorized_keys";
        challengeCommon["ls -la .ssh"] = challengeCommon["ls -la ~/.ssh"];
        challengeCommon["cat .env"] = "DB_PASSWORD=hunter2\nAPI_KEY=sk-prod-a8f2e9c1d4b7\nAWS_SECRET_ACCESS_KEY=EXAMPLE/K7MDENG/bPxRfiCY\nSTRIPE_SECRET=sk_test_EXAMPLE_KEY_DO_NOT_USE";
        challengeCommon["cat deploy.sh"] = "#!/bin/bash\nset -e\n\ngit pull origin main\nnpm install\nnpm run build\nsudo systemctl reload nginx\necho 'Deployed!'";
        challengeCommon["cat docker-compose.yml"] = "version: '3'\nservices:\n  app:\n    image: app:latest\n    ports:\n      - '8080:8080'\n  nginx:\n    image: nginx:latest\n    ports:\n      - '80:80'";
        challengeCommon["ls /var/log"] = "auth.log  nginx  syslog  kern.log";
        challengeCommon["ls /var/log/nginx"] = "access.log  error.log";
      }
      if (c in challengeCommon) {
        setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, { t: "out", v: challengeCommon[c] }]);
        setInput("");
        return;
      }
      // fall through to common commands / unknown
    }

    if (!lessonDone && !ch.mode) {
      // Check if it matches the current step first
      // Special interactive steps use magic tokens as accept values
      const ok = st.accept.some(a => norm(a) === c) || st.accept.includes(c);
      setCmdH(h => [trimmed, ...h]); setCmdI(-1);
      recordCommand();

      if (ok) {
        const newDir = resolveCd(c);
        if (newDir) setCwd(newDir);

        // Apply side effects for shell-modifying commands
        const aliasM = c.match(/^alias\s+(\w+)=["']?(.+?)["']?$/);
        if (aliasM) {
          const newCfg = updateShellConfig({ aliases: { ...shellConfig.aliases, [aliasM[1]]: aliasM[2] } });
          setShellConfig(newCfg);
        }
        const psM = c.match(/^export\s+ps1=["'](.+)["']$/i);
        const lsM = c.match(/^export\s+ls_colors=["'](.+)["']$/i);
        if (psM || lsM) {
          const updates = {};
          if (psM) updates.ps1 = psM[1];
          if (lsM) updates.lsColors = lsM[1];
          const newCfg = updateShellConfig(updates);
          setShellConfig(newCfg);
        }
        if (c === "source ~/.bashrc" || c === ". ~/.bashrc") {
          if (vanishMode) {
            setVanishMode(false);
            const cfg = getShellConfig();
            setShellConfig(cfg);
          }
        }
        if (c.match(/^echo\s+.+>>\s*~\/\.bashrc$/)) {
          const aliasLine = trimmed.match(/alias\s+(\w+)=["\\]*["']?(.+?)["\\]*["']?\s*['"]/);
          if (aliasLine) {
            const newCfg = updateShellConfig({ aliases: { ...shellConfig.aliases, [aliasLine[1]]: aliasLine[2] } });
            setShellConfig(newCfg);
          }
        }

        // Resolve special output tokens
        let outItems = [];
        if (st.output === "__vanish_fail__") {
          outItems = [{ t: "err", v: `bash: ${firstWord}: command not found` }];
        } else if (st.output === "__cat_bashrc__") {
          const cfg = shellConfig;
          const lines = ["# ~/.bashrc — shell configuration", "", "# System defaults", "export PATH=\"/usr/local/bin:$PATH\"", "export EDITOR=vim", ""];
          lines.push("# Prompt", "PS1='\\u@\\h:\\w\\$ '", "");
          lines.push("# History", "HISTSIZE=10000", "HISTCONTROL=ignoredups", "", "# Aliases", "alias ls='ls --color=auto'", "alias grep='grep --color=auto'");
          if (cfg.ps1) { lines.push("", "# Custom prompt", `PS1='${cfg.ps1}'`); }
          if (cfg.lsColors) { lines.push("", "# File colors", `export LS_COLORS="${cfg.lsColors}"`); }
          Object.entries(cfg.aliases || {}).forEach(([k, v]) => { lines.push(`alias ${k}="${v}"`); });
          outItems = [{ t: "out", v: lines.join("\n") }];
        } else if (st.output === "__source_bashrc__") {
          outItems = [];
        } else if (st.output === "__colored_ls__") {
          outItems = [{ t: "colored-ls", v: shellConfig.lsColors }];
        } else if (st.output?.startsWith("__ansi_green__")) {
          outItems = [{ t: "ansi", v: st.output.replace("__ansi_green__", ""), color: "#4ade80" }];
        } else if (st.output) {
          outItems = [{ t: "out", v: st.output }];
        }
        setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, ...outItems, { t: "note", v: st.note }]);
        setHint(false); setInput("");
        const nx = stIdx + 1;
        if (nx >= ch.steps.length) { setDone(d => new Set([...d, chIdx])); setHist(h => [...h, { t: "done", v: ch.title }]); }
        setStIdx(nx);
        setMaxStIdx(m => Math.max(m, nx));
        saveStepProgress(chIdx, nx);
        return;
      }
    } else {
      setCmdH(h => [trimmed, ...h]); setCmdI(-1);
    }

    // Handle alias creation
    const aliasMatch = c.match(/^alias\s+(\w+)=["']?(.+?)["']?$/);
    if (aliasMatch) {
      const [, name, value] = aliasMatch;
      const newConfig = updateShellConfig({ aliases: { ...shellConfig.aliases, [name]: value } });
      setShellConfig(newConfig);
      setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }]);
      setInput("");
      // Check if this is a lesson step
      if (!lessonDone && st) {
        const ok = st.accept.some(a => norm(a) === c);
        if (ok) {
          setCmdH(h => [trimmed, ...h]); setCmdI(-1); recordCommand();
          setHist(h => [...h, ...(st.output ? [{ t: "out", v: st.output }] : []), { t: "note", v: st.note }]);
          setHint(false);
          const nx = stIdx + 1;
          if (nx >= ch.steps.length) { setDone(d => new Set([...d, chIdx])); setHist(h => [...h, { t: "done", v: ch.title }]); }
          setStIdx(nx); setMaxStIdx(m => Math.max(m, nx)); saveStepProgress(chIdx, nx);
        }
      }
      return;
    }

    // Handle 'type' command
    if (c.startsWith("type ")) {
      const cmd = c.slice(5).trim();
      const aliasVal = (!vanishMode && shellConfig.aliases[cmd]) ? shellConfig.aliases[cmd] : null;
      const output = aliasVal ? `${cmd} is aliased to '${aliasVal}'` : `${cmd} is /usr/bin/${cmd}`;
      setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, { t: "out", v: output }]);
      setInput("");
      if (!lessonDone && st && st.accept.some(a => norm(a) === c)) {
        setCmdH(h => [trimmed, ...h]); setCmdI(-1); recordCommand();
        setHist(h => [...h, { t: "note", v: st.note }]);
        setHint(false);
        const nx = stIdx + 1;
        if (nx >= ch.steps.length) { setDone(d => new Set([...d, chIdx])); setHist(h => [...h, { t: "done", v: ch.title }]); }
        setStIdx(nx); setMaxStIdx(m => Math.max(m, nx)); saveStepProgress(chIdx, nx);
      }
      return;
    }

    // Handle alias usage (e.g. "please echo hello" -> "sudo echo hello")
    if (!vanishMode && shellConfig.aliases[firstWord]) {
      const expanded = c.replace(firstWord, shellConfig.aliases[firstWord]);
      const expandedNorm = norm(expanded);
      // Check if this is a lesson step match
      if (!lessonDone && st) {
        const ok = st.accept.some(a => norm(a) === c || norm(a) === expandedNorm);
        if (ok) {
          setCmdH(h => [trimmed, ...h]); setCmdI(-1); recordCommand();
          const output = st.output === "__vanish_fail__"
            ? `bash: ${firstWord}: command not found`
            : st.output || null;
          setHist(h => [...h, { t: "in", v: trimmed, dir: cwd },
            ...(output && output !== "__vanish_fail__" ? [{ t: "out", v: output }] : []),
            { t: "note", v: st.note }]);
          setHint(false); setInput("");
          const nx = stIdx + 1;
          if (nx >= ch.steps.length) { setDone(d => new Set([...d, chIdx])); setHist(h => [...h, { t: "done", v: ch.title }]); }
          setStIdx(nx); setMaxStIdx(m => Math.max(m, nx)); saveStepProgress(chIdx, nx);
          return;
        }
      }
      // Execute the expanded alias as a common command
      const echoMatch = expandedNorm.match(/^(?:sudo\s+)?echo\s+(.*)/);
      if (echoMatch) {
        const text = echoMatch[1].replace(/^["']|["']$/g, "");
        setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, { t: "out", v: text }]);
        setInput("");
        return;
      }
    }

    // Handle export for shell config
    if (c.startsWith("export ")) {
      const psMatch = c.match(/^export\s+ps1=["'](.+)["']$/i);
      const lsMatch = c.match(/^export\s+ls_colors=["'](.+)["']$/i);
      if (psMatch || lsMatch) {
        const updates = {};
        if (psMatch) updates.ps1 = psMatch[1];
        if (lsMatch) updates.lsColors = lsMatch[1];
        const newConfig = updateShellConfig(updates);
        setShellConfig(newConfig);
      }
      setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }]);
      setInput("");
      if (!lessonDone && st && st.accept.some(a => norm(a) === c)) {
        setCmdH(h => [trimmed, ...h]); setCmdI(-1); recordCommand();
        setHist(h => [...h, ...(st.output ? [{ t: "out", v: st.output }] : []), { t: "note", v: st.note }]);
        setHint(false);
        const nx = stIdx + 1;
        if (nx >= ch.steps.length) { setDone(d => new Set([...d, chIdx])); setHist(h => [...h, { t: "done", v: ch.title }]); }
        setStIdx(nx); setMaxStIdx(m => Math.max(m, nx)); saveStepProgress(chIdx, nx);
      }
      return;
    }

    // Handle source ~/.bashrc
    if (c === "source ~/.bashrc" || c === ". ~/.bashrc") {
      if (vanishMode) {
        setVanishMode(false);
        // Restore aliases from config
        const cfg = getShellConfig();
        setShellConfig(cfg);
      }
      setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }]);
      setInput("");
      if (!lessonDone && st && st.accept.some(a => norm(a) === c)) {
        setCmdH(h => [trimmed, ...h]); setCmdI(-1); recordCommand();
        setHist(h => [...h, ...(st.output ? [{ t: "out", v: st.output }] : []), { t: "note", v: st.note }]);
        setHint(false);
        const nx = stIdx + 1;
        if (nx >= ch.steps.length) { setDone(d => new Set([...d, chIdx])); setHist(h => [...h, { t: "done", v: ch.title }]); }
        setStIdx(nx); setMaxStIdx(m => Math.max(m, nx)); saveStepProgress(chIdx, nx);
      }
      return;
    }

    // Handle echo >> ~/.bashrc (append to bashrc)
    if (c.match(/^echo\s+.+>>\s*~\/\.bashrc$/)) {
      setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }]);
      setInput("");
      if (!lessonDone && st && st.accept.some(a => norm(a) === c)) {
        // Save the alias to persistent config
        const aliasLine = trimmed.match(/alias\s+(\w+)=["\\]*["']?(.+?)["\\]*["']?\s*['"]/);
        if (aliasLine) {
          const newConfig = updateShellConfig({ aliases: { ...shellConfig.aliases, [aliasLine[1]]: aliasLine[2] } });
          setShellConfig(newConfig);
        }
        setCmdH(h => [trimmed, ...h]); setCmdI(-1); recordCommand();
        setHist(h => [...h, ...(st.output ? [{ t: "out", v: st.output }] : []), { t: "note", v: st.note }]);
        setHint(false);
        const nx = stIdx + 1;
        if (nx >= ch.steps.length) { setDone(d => new Set([...d, chIdx])); setHist(h => [...h, { t: "done", v: ch.title }]); }
        setStIdx(nx); setMaxStIdx(m => Math.max(m, nx)); saveStepProgress(chIdx, nx);
      }
      return;
    }

    // Handle neofetch (custom stack output)
    if (c === "neofetch") {
      const cfg = shellConfig;
      const themeLabel = cfg.theme ? cfg.theme.charAt(0).toUpperCase() + cfg.theme.slice(1) : "Default";
      const fontLabel = cfg.font || "System Mono";
      const aliasCount = Object.keys(cfg.aliases || {}).length;
      const output = [
        "       _   _          ",
        "      | | | |         ubuntu@gpu-box",
        "      | |_| |___      ─────────────────",
        "      |  _  / _ \\     OS: Ubuntu 22.04 LTS",
        "      |_| |_\\___/     Shell: bash 5.2.15",
        `                      Prompt: ${cfg.ps1Emoji || ""} custom PS1`,
        `                      Theme: ${themeLabel}`,
        `                      Font: ${fontLabel}`,
        `                      Aliases: ${aliasCount} configured`,
        `                      Colors: ${cfg.lsColors ? "custom LS_COLORS" : "default"}`,
        "                      Terminal: xterm-256color",
        "",
        "      ████████████████",
      ].join("\n");
      setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, { t: "out", v: output }]);
      setInput("");
      if (!lessonDone && st && st.accept.some(a => norm(a) === c)) {
        setCmdH(h => [trimmed, ...h]); setCmdI(-1); recordCommand();
        setHist(h => [...h, { t: "note", v: st.note }]);
        setHint(false);
        const nx = stIdx + 1;
        if (nx >= ch.steps.length) { setDone(d => new Set([...d, chIdx])); setHist(h => [...h, { t: "done", v: ch.title }]); }
        setStIdx(nx); setMaxStIdx(m => Math.max(m, nx)); saveStepProgress(chIdx, nx);
      }
      return;
    }

    // Handle cat ~/.bashrc anywhere
    if (c === "cat ~/.bashrc" || c === "cat .bashrc") {
      const cfg = shellConfig;
      const lines = ["# ~/.bashrc — shell configuration", "", "# System defaults", "export PATH=\"/usr/local/bin:$PATH\"", "export EDITOR=vim", ""];
      lines.push("# Prompt", "PS1='\\u@\\h:\\w\\$ '", "");
      lines.push("# History", "HISTSIZE=10000", "HISTCONTROL=ignoredups", "", "# Aliases", "alias ls='ls --color=auto'", "alias grep='grep --color=auto'");
      if (cfg.ps1) { lines.push("", "# Custom prompt", `PS1='${cfg.ps1}'`); }
      if (cfg.lsColors) { lines.push("", "# File colors", `export LS_COLORS="${cfg.lsColors}"`); }
      Object.entries(cfg.aliases || {}).forEach(([k, v]) => { lines.push(`alias ${k}="${v}"`); });
      setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, { t: "out", v: lines.join("\n") }]);
      setInput("");
      return;
    }

    // Chapter-aware ls — tracks files created/modified by completed steps
    const chapterLs = (() => {
      if (!ch) return null;
      const id = ch.id;
      const s = maxStIdx; // furthest step reached
      if (id === "files") {
        // base: config.yaml  notes.md  old.log  scripts  tmp_logs
        const items = ["config.yaml", "notes.md", "old.log", "scripts", "tmp_logs"];
        if (s > 0) items.push("logs");         // step 0: mkdir logs
        if (s > 2) items.push("notes.txt");    // step 2: touch notes.txt
        if (s > 4) items.push("config.backup.yaml"); // step 4: cp config.yaml config.backup.yaml
        if (s > 5) { // step 5: mv notes.md README.md
          const ni = items.indexOf("notes.md");
          if (ni >= 0) items.splice(ni, 1);
          items.push("README.md");
        }
        if (s > 6) { // step 6: rm old.log
          const oi = items.indexOf("old.log");
          if (oi >= 0) items.splice(oi, 1);
        }
        if (s > 7) { // step 7: rm -r tmp_logs/
          const ti = items.indexOf("tmp_logs");
          if (ti >= 0) items.splice(ti, 1);
        }
        return items.sort().join("  ");
      }
      if (id === "tools") {
        // base: models  src  project
        const items = ["models", "src", "project"];
        if (s > 0) items.push("current");      // step 0: ln -s models/v2 current
        if (s > 3) items.push("src.tar.gz");   // step 3: tar -czf src.tar.gz src/
        if (s > 5) items.push("project.zip");  // step 5: zip -r project.zip project/
        return items.sort().join("  ");
      }
      if (id === "pipe") {
        const items = ["project", "notes.md", "scripts"];
        if (s > 0) items.push("greeting.txt"); // step 0: echo hello world > greeting.txt
        return items.sort().join("  ");
      }
      if (id === "git") {
        const items = ["project", "notes.md", "scripts"];
        if (s > 0) items.push("project.git");  // step 0: git clone
        return items.sort().join("  ");
      }
      return null;
    })();

    // Common commands always work — the terminal should feel real
    const common = {
      "pwd": cwd,
      "ls": chapterLs || "project  notes.md  scripts",
      "ls -la": "drwxr-xr-x  5 ubuntu ubuntu 4096 Mar 18 22:15 .\ndrwxr-xr-x  3 ubuntu ubuntu 4096 Mar 18 22:00 ..\n-rw-r--r--  1 ubuntu ubuntu 3771 Mar  5 14:00 .bashrc\ndrwxr-xr-x  2 ubuntu ubuntu 4096 Mar 10 09:30 .ssh\ndrwxr-xr-x  8 ubuntu ubuntu 4096 Mar 17 16:45 project\n-rw-r--r--  1 ubuntu ubuntu  120 Mar 15 11:20 notes.md\ndrwxr-xr-x  3 ubuntu ubuntu 4096 Mar 12 14:00 scripts",
      "ls -al": "drwxr-xr-x  5 ubuntu ubuntu 4096 Mar 18 22:15 .\ndrwxr-xr-x  3 ubuntu ubuntu 4096 Mar 18 22:00 ..\n-rw-r--r--  1 ubuntu ubuntu 3771 Mar  5 14:00 .bashrc\ndrwxr-xr-x  2 ubuntu ubuntu 4096 Mar 10 09:30 .ssh\ndrwxr-xr-x  8 ubuntu ubuntu 4096 Mar 17 16:45 project\n-rw-r--r--  1 ubuntu ubuntu  120 Mar 15 11:20 notes.md\ndrwxr-xr-x  3 ubuntu ubuntu 4096 Mar 12 14:00 scripts",
      "ls -l": "drwxr-xr-x  8 ubuntu ubuntu 4096 Mar 17 16:45 project\n-rw-r--r--  1 ubuntu ubuntu  120 Mar 15 11:20 notes.md\ndrwxr-xr-x  3 ubuntu ubuntu 4096 Mar 12 14:00 scripts",
      "ls -a": ".  ..  .bashrc  .ssh  project  notes.md  scripts",
      "ls -lah": "drwxr-xr-x  5 ubuntu ubuntu 4.0K Mar 18 22:15 .\ndrwxr-xr-x  3 ubuntu ubuntu 4.0K Mar 18 22:00 ..\n-rw-r--r--  1 ubuntu ubuntu 3.7K Mar  5 14:00 .bashrc\ndrwxr-xr-x  2 ubuntu ubuntu 4.0K Mar 10 09:30 .ssh\ndrwxr-xr-x  8 ubuntu ubuntu 4.0K Mar 17 16:45 project\n-rw-r--r--  1 ubuntu ubuntu  120 Mar 15 11:20 notes.md\ndrwxr-xr-x  3 ubuntu ubuntu 4.0K Mar 12 14:00 scripts",
      // Chapter-specific cat/ls overrides for created files
      ...(ch?.id === "files" ? Object.fromEntries(Object.entries({
        "cat config.yaml": "# Application Config\nport: 8080\nhost: 0.0.0.0\ndebug: false\nlog_level: info",
        "cat notes.txt": maxStIdx > 2 ? "(empty file)" : null,
        "cat config.backup.yaml": maxStIdx > 4 ? "# Application Config\nport: 8080\nhost: 0.0.0.0\ndebug: false\nlog_level: info" : null,
        "cat README.md": maxStIdx > 5 ? "# Project Notes" : null,
        "ls logs": maxStIdx > 0 ? "(empty directory)" : null,
        "ls tmp_logs": maxStIdx <= 7 ? "debug.log  crash.log" : null,
      }).filter(([, v]) => v !== null)) : {}),
      ...(ch?.id === "pipe" ? Object.fromEntries(Object.entries({
        "cat greeting.txt": maxStIdx > 0 ? (maxStIdx > 1 ? "hello world\ngoodbye" : "hello world") : null,
      }).filter(([, v]) => v !== null)) : {}),
      ...(ch?.id === "tools" ? {
        "ls models": "v1  v2  v3",
        "ls models/v2": "model.bin  config.json",
        "ls src": "main.py  utils.py  config.py",
        "ls project": "index.js  package.json  README.md",
      } : {}),
      ...(ch?.id === "git" ? Object.fromEntries(Object.entries({
        "ls project.git": maxStIdx > 0 ? "src  README.md  package.json  .git" : null,
      }).filter(([, v]) => v !== null)) : {}),
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

    // Handle man pages
    if (c.startsWith("man ")) {
      const cmd = c.slice(4).trim();
      const page = MAN_PAGES[cmd];
      if (page) {
        setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, { t: "out", v: page }]);
      } else {
        setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, { t: "err", v: `No manual entry for ${cmd}` }]);
      }
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

    // Check steps in the current chapter — user may re-run earlier commands (or any command after completion)
    const checkUpTo = lessonDone ? ch.steps.length : stIdx;
    for (let i = 0; i < checkUpTo; i++) {
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
      "zip", "unzip", "gzip", "gunzip", "make", "gcc", "python", "python3", "node", "bash",
      "ss", "netstat", "free", "df", "uptime", "tree"];
    if (knownCmds.includes(firstWord)) {
      const msg = lessonDone
        ? `(simulated) ✓ valid command`
        : `(simulated) ✓ valid command — but this step is asking for something else. Check the task on the left.`;
      setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, { t: "out", v: msg }]);
      setInput("");
      return;
    }

    // Unknown command
    setShake(true); setTimeout(() => setShake(false), 500);
    setHist(h => [...h, { t: "in", v: trimmed, dir: cwd }, { t: "err", v: `bash: ${firstWord}: command not found` }]);
    setInput("");
  }, [input, st, stIdx, ch, lessonDone, chIdx, cwd, resolveCd, cmdH, shellConfig, vanishMode, completedSteps]);

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
    if (lessonDone || !ch) return;
    if (ch.mode === "challenge") {
      const skipIdx = ch.steps.findIndex((_, i) => !completedSteps.has(i));
      if (skipIdx < 0) return;
      const skipStep = ch.steps[skipIdx];
      const skipDir = resolveCd(norm(skipStep.hint));
      if (skipDir) setCwd(skipDir);
      const newCompleted = new Set([...completedSteps, skipIdx]);
      setCompletedSteps(newCompleted);
      setHist(h => [...h, { t: "in", v: "skip", dir: cwd }, ...(skipStep.output ? [{ t: "out", v: skipStep.output }] : []), { t: "note", v: `(skipped) ${skipStep.note}` }]);
      setHint(false); setInput("");
      if (newCompleted.size >= ch.steps.length) {
        setDone(d => new Set([...d, chIdx]));
        setHist(h => [...h, { t: "done", v: ch.title }]);
      }
      setStIdx(skipIdx + 1);
      setMaxStIdx(m => Math.max(m, skipIdx + 1));
      saveStepProgress(chIdx, newCompleted.size);
      return;
    }
    if (!st) return;
    const skipDir = resolveCd(norm(st.hint));
    if (skipDir) setCwd(skipDir);
    setHist(h => [...h, { t: "in", v: "skip", dir: cwd }, ...(st.output ? [{ t: "out", v: st.output }] : []), { t: "note", v: `(skipped) ${st.note}` }]);
    setHint(false); setInput("");
    const nx = stIdx + 1;
    if (nx >= ch.steps.length) { setDone(d => new Set([...d, chIdx])); setHist(h => [...h, { t: "done", v: ch.title }]); }
    setStIdx(nx);
    setMaxStIdx(m => Math.max(m, nx));
    saveStepProgress(chIdx, nx);
  }, [st, stIdx, ch, lessonDone, chIdx, resolveCd, cwd, completedSteps]);

  if (screen === "landing") return (
    <LandingScreen mob={mob} navIdx={navIdx} setNavIdx={setNavIdx} setDevice={setDevice} setScreen={setScreen} showInfo={showInfo} setShowInfo={setShowInfo} setDone={setDone} setShowOnboarding={setShowOnboarding} />
  );

  if (screen === "setup") return (
    <SetupScreen mob={mob} device={device} setScreen={setScreen} />
  );

  return (
    <MenuScreen
      mob={mob} device={device} done={done} navIdx={navIdx} setNavIdx={setNavIdx}
      startCh={startCh} setScreen={setScreen} showInfo={showInfo} setShowInfo={setShowInfo}
      showOnboarding={showOnboarding} setShowOnboarding={setShowOnboarding}
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
      shellConfig={shellConfig}
      setShellConfig={setShellConfig}
      vanishMode={vanishMode}
      setVanishMode={setVanishMode}
      completedSteps={completedSteps}
      go={go}
    />
  );
}

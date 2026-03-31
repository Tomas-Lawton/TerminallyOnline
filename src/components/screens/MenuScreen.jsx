import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { CHAPTERS } from "@/data/chapters";
import { DEVICES } from "@/data/devices";
import { THEMES, FONTS, PS1_COLORS, PS1_EMOJIS } from "@/data/themes";
import { getStreak, getTotalCommands, resetAllProgress, saveProgress, saveStepProgress } from "@/utils/progress";
import { renderCode } from "@/utils/helpers";
import { updateShellConfig } from "@/utils/shellConfig";
import InfoModal from "../ui/InfoModal";
import ShareCard from "../ui/ShareCard";
import OnboardingModal from "../ui/OnboardingModal";
import SandboxScreen from "./SandboxScreen";
import "@/styles/terminal.css";

const mono =
  "'SF Mono','Fira Code','JetBrains Mono','Menlo','Consolas',monospace";
const bg = "#191922";
const FS = 13;

const groups = [
  { label: "Getting Started", color: "#f9c74f", ids: ["basics", "files", "perm", "read", "pipe", "tools"], summary: "You've mastered the shell fundamentals — navigation, files, permissions, reading, pipes, and essential tools.", graduation: "Graduation — Shell Fundamentals" },
  { label: "Real-World Skills", color: "#f97316", ids: ["sys", "git", "ssh", "docker", "nginx", "boss"], summary: "You've conquered system admin, version control, remote access, containers, web servers, and handled a production incident under pressure.", graduation: "Graduation — Real-World Skills" },
  { label: "Challenges", color: "#ef4444", ids: ["ch-deploy", "ch-debug", "ch-lockdown"], summary: "You've proven you can solve real problems independently.", graduation: "Graduation — Challenge Master" },
  { label: "Bonus", color: "#a78bfa", ids: ["custom", "ai"], summary: "You've customised your terminal and learned how to use AI tools. The extras that make you dangerous.", graduation: "Graduation — Bonus Complete" },
];

const ASCII_ART = [
  " ╔══════════════════════════╗        ",
  " ║  ┌────────────────────┐  ║║║║║║   ",
  " ║  │ $ whoami           │  ║║║║║║║║ ",
  " ║  │ terminallyonline   │  ║║║║║║║║║",
  " ║  │                    │  ║║║║║║║║║",
  " ║  │ $ echo 'hello'     │  ║║║║║║║║║",
  " ║  │ hello              │  ║║║║║║║║║",
  " ║  │                    │  ║║║║║║║║║",
  " ║  │ $ _                │  ║║║║║║║║║",
  " ║  └────────────────────┘  ║║║║║║║║║",
  " ║  ◉                    ▪  ║║║║║║║║║",
  " ╚══════════════════════════╝║║║║║║║ ",
  " ╔══════════════════════════╗║║║║║║  ",
  " ║ ░░░░░░░░░░░░░░░░░░░░░░   ║║║║║    ",
  " ╚══════════════════════════╝║║║     ",
  "┌───┴────────────────┴───┐║║║║       ",
  "│  ┌──┐              ◎   │║║║║       ",
  "│  │▓▓│ ▁▁▁▁▁▁▁▁▁▁▁▁     │║║║║       ",
  "│  └──┘ ▔▔▔▔▔▔▔▔▔▔▔▔     │║║║        ",
  "└────────────────────────┘           ",
];

const colorBlocksBase = [
  "#3a3aae",
  "#e06060",
  null, // replaced by activeTheme.accent at render time
  "#f9c74f",
  "#38bdf8",
  "#c084fc",
  "#22d3ee",
  "#ddd",
];

export default function MenuScreen({
  mob,
  device,
  done,
  navIdx,
  setNavIdx,
  startCh,
  setScreen,
  showInfo,
  setShowInfo,
  showOnboarding,
  setShowOnboarding,
  // Lesson props (only present when lesson is active)
  lessonActive,
  sandboxActive,
  chIdx,
  stIdx,
  maxStIdx,
  hist,
  hint,
  shake,
  input,
  setInput,
  kd,
  cwd,
  goBack,
  goToStep,
  exitLesson,
  skip,
  restartCh,
  setDone,
  shellConfig,
  setShellConfig,
  completedSteps,
  go,
}) {
  const inRef = useRef(null);
  const scRef = useRef(null);
  const tutRef = useRef(null);
  const [showShare, setShowShare] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    try { return parseInt(localStorage.getItem("tol_font_size")) || 13; } catch { return 13; }
  });
  const setFontSizeTo = useCallback((size) => {
    setFontSize(size);
    try { localStorage.setItem("tol_font_size", String(size)); } catch { /* noop */ }
  }, []);
  const [graduationTitle, setGraduationTitle] = useState(null); // used by graduation feature below
  const [sectionModal, setSectionModal] = useState(null);
  const shownSections = useRef(new Set(JSON.parse(localStorage.getItem("tol_sections_done") || "[]")));

  // Prompt builder state — restore from shellConfig
  const [pbEmoji, setPbEmoji] = useState(() => shellConfig?.ps1Emoji || "$");
  const [pbShowUser, setPbShowUser] = useState(() => shellConfig?.ps1ShowUser !== undefined ? shellConfig.ps1ShowUser : true);
  const [pbShowHost, setPbShowHost] = useState(() => shellConfig?.ps1ShowHost !== undefined ? shellConfig.ps1ShowHost : true);
  const [pbDirMode, setPbDirMode] = useState(() => shellConfig?.ps1DirMode || "full");
  const [pbColor, setPbColor] = useState(() => shellConfig?.ps1Color || "cyan");
  const [pbShowTime, setPbShowTime] = useState(() => shellConfig?.ps1ShowTime || false);

  // Theme picker state
  const [tpTheme, setTpThemeRaw] = useState("default");
  const [tpFont, setTpFontRaw] = useState("default");

  // When theme/font change, immediately apply globally
  const setTpTheme = useCallback((key) => {
    setTpThemeRaw(key);
    const newConfig = updateShellConfig({ theme: key });
    setShellConfig(newConfig);
  }, [setShellConfig]);

  const setTpFont = useCallback((key) => {
    setTpFontRaw(key);
    const fontDef = FONTS[key];
    if (fontDef) {
      const newConfig = updateShellConfig({ font: fontDef.name });
      setShellConfig(newConfig);
    }
  }, [setShellConfig]);

  // Load font when theme picker font changes
  useEffect(() => {
    const fontDef = FONTS[tpFont];
    if (fontDef?.url) {
      const id = `font-${tpFont}`;
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = fontDef.url;
        document.head.appendChild(link);
      }
    }
  }, [tpFont]);

  // Also load shell config font on mount
  useEffect(() => {
    if (shellConfig?.font) {
      const fontKey = Object.keys(FONTS).find(k => FONTS[k].name === shellConfig.font);
      if (fontKey) {
        setTpFontRaw(fontKey);
        const fontDef = FONTS[fontKey];
        if (fontDef?.url) {
          const id = `font-${fontKey}`;
          if (!document.getElementById(id)) {
            const link = document.createElement("link");
            link.id = id;
            link.rel = "stylesheet";
            link.href = fontDef.url;
            document.head.appendChild(link);
          }
        }
      }
    }
    if (shellConfig?.theme && THEMES[shellConfig.theme]) {
      setTpThemeRaw(shellConfig.theme);
    }
  }, []);

  // Build PS1 preview string
  const buildPs1Preview = useCallback(() => {
    const parts = [];
    if (pbEmoji) parts.push(pbEmoji + " ");
    if (pbShowUser) parts.push("ubuntu");
    if (pbShowUser && pbShowHost) parts.push("@");
    if (pbShowHost) parts.push("gpu-box");
    if ((pbShowUser || pbShowHost) && pbDirMode) parts.push(":");
    if (pbDirMode === "full") parts.push("~/project");
    else if (pbDirMode === "basename") parts.push("project");
    if (pbShowTime) parts.push(" [10:42]");
    parts.push("$ ");
    return parts.join("");
  }, [pbEmoji, pbShowUser, pbShowHost, pbDirMode, pbShowTime]);

  const buildPs1String = useCallback(() => {
    const colorCode = PS1_COLORS[pbColor]?.code || "32";
    const parts = [];
    parts.push(`\\[\\033[1;${colorCode}m\\]`);
    if (pbEmoji) parts.push(pbEmoji + " ");
    if (pbShowUser) parts.push("\\u");
    if (pbShowUser && pbShowHost) parts.push("@");
    if (pbShowHost) parts.push("\\h");
    if ((pbShowUser || pbShowHost) && pbDirMode) parts.push(":");
    if (pbDirMode === "full") parts.push("\\w");
    else if (pbDirMode === "basename") parts.push("\\W");
    if (pbShowTime) parts.push(" [\\t]");
    parts.push("\\[\\033[0m\\]$ ");
    return parts.join("");
  }, [pbEmoji, pbShowUser, pbShowHost, pbDirMode, pbColor, pbShowTime]);

  // Auto-apply prompt changes immediately as user interacts
  useEffect(() => {
    const ps1 = buildPs1String();
    const newConfig = updateShellConfig({
      ps1,
      ps1Emoji: pbEmoji,
      ps1Color: pbColor,
      ps1ShowUser: pbShowUser,
      ps1ShowHost: pbShowHost,
      ps1DirMode: pbDirMode,
      ps1ShowTime: pbShowTime,
    });
    setShellConfig(newConfig);
  }, [buildPs1String, pbEmoji, pbColor, pbShowUser, pbShowHost, pbDirMode, pbShowTime]); // eslint-disable-line react-hooks/exhaustive-deps

  // activeTheme/activeFont are defined after `st` is available (see below)

  useEffect(() => {
    if (scRef.current) scRef.current.scrollTop = scRef.current.scrollHeight;
  }, [hist, stIdx]);
  useEffect(() => {
    if (lessonActive && inRef.current) inRef.current.focus();
  }, [stIdx, lessonActive]);
  useEffect(() => {
    if (tutRef.current) tutRef.current.scrollTop = tutRef.current.scrollHeight;
  }, [stIdx, hint]);

  // Check for section completion — when done changes, check if a section just completed
  useEffect(() => {
    for (const g of groups) {
      if (shownSections.current.has(g.label)) continue;
      const allDone = g.ids.every((id) => {
        const ci = CHAPTERS.findIndex((c) => c.id === id);
        return ci >= 0 && done.has(ci);
      });
      if (allDone) {
        shownSections.current.add(g.label);
        localStorage.setItem("tol_sections_done", JSON.stringify([...shownSections.current]));
        const showModal = () => {
          if (g.graduation) {
            // Show graduation ShareCard instead of regular section modal
            setGraduationTitle(g.graduation);
            setShowShare(true);
          } else {
            setSectionModal(g);
          }
        };
        if (lessonActive) {
          exitLesson();
          setTimeout(showModal, 300);
        } else {
          showModal();
        }
        break;
      }
    }
  }, [done, lessonActive, exitLesson]);

  // Auto-show graduation certificate when all chapters complete
  useEffect(() => {
    const allDone = done.size >= CHAPTERS.length;
    if (!allDone) return;
    const alreadyShown = localStorage.getItem("tol_cert_shown");
    if (alreadyShown) return;
    // Delay so it doesn't overlap with section completion modal
    const timer = setTimeout(() => {
      localStorage.setItem("tol_cert_shown", "1");
      setGraduationTitle("Graduation — Shell Expert");
      setShowShare(true);
    }, sectionModal ? 600 : 100);
    return () => clearTimeout(timer);
  }, [done, sectionModal]);

  const menuItems = useMemo(() => {
    const items = [];
    groups.forEach((g) =>
      g.ids.forEach((id) => {
        const ci = CHAPTERS.findIndex((c) => c.id === id);
        if (ci >= 0) items.push({ type: "chapter", idx: ci });
      }),
    );
    items.push({ type: "sandbox" });
    return items;
  }, []);

  const totalS = CHAPTERS.reduce((a, c) => a + c.steps.length, 0);
  const doneS = [...done].reduce(
    (a, i) => a + (CHAPTERS[i]?.steps.length || 0),
    0,
  );
  const allComplete = done.size >= CHAPTERS.length;
  const streak = getStreak();
  const totalCmds = getTotalCommands();
  const pct = Math.round((doneS / totalS) * 100);
  const barWidth = 16;
  const filled = Math.round((doneS / totalS) * barWidth);

  const ch = lessonActive ? CHAPTERS[chIdx] : null;
  const st = ch?.steps[stIdx];
  const lessonDone = ch ? stIdx >= ch.steps.length : false;
  const isCtrlStep = st?.accept?.some(a => /^ctrl\+/i.test(a));

  // Get active theme colors — during theme-picker step, always use tpTheme for live preview
  const isThemeStep = st?.type === "theme-picker";
  const activeTheme = isThemeStep
    ? (THEMES[tpTheme] || THEMES.default)
    : (THEMES[shellConfig?.theme] || THEMES[tpTheme] || THEMES.default);
  const activeFont = isThemeStep
    ? (FONTS[tpFont]?.family || mono)
    : shellConfig?.font
      ? (Object.values(FONTS).find(f => f.name === shellConfig.font)?.family || mono)
      : FONTS[tpFont]?.family || mono;

  const colorBlocks = colorBlocksBase.map(c => c || activeTheme.accent);

  const cwdDisplay =
    cwd === "/home/ubuntu"
      ? "~"
      : cwd?.startsWith("/home/ubuntu/")
        ? "~" + cwd.slice(12)
        : cwd || "~";
  // Build prompt from shell config if customised
  const buildPromptFromConfig = (dir) => {
    const cfg = shellConfig;
    if (!cfg?.ps1Emoji && !cfg?.ps1Color) return null; // no customisation
    const d = dir || cwdDisplay;
    const bn = d === "~" ? "~" : d.split("/").pop() || "~";
    const parts = [];
    if (cfg.ps1Emoji) parts.push(cfg.ps1Emoji + " ");
    if (cfg.ps1ShowUser !== false) parts.push("ubuntu");
    if (cfg.ps1ShowUser !== false && cfg.ps1ShowHost !== false) parts.push("@");
    if (cfg.ps1ShowHost !== false) parts.push("gpu-box");
    if ((cfg.ps1ShowUser !== false || cfg.ps1ShowHost !== false)) parts.push(":");
    parts.push(cfg.ps1DirMode === "basename" ? bn : d);
    if (cfg.ps1ShowTime) parts.push(` [${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}]`);
    parts.push("$ ");
    return parts.join("");
  };

  const customPromptColor = shellConfig?.ps1Color ? (PS1_COLORS[shellConfig.ps1Color]?.hex || activeTheme.accent) : null;
  const prompt = mob ? "$" : (buildPromptFromConfig() || `ubuntu@server:${cwdDisplay}$`);

  const handleFocus = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0) return;
    if (inRef.current) inRef.current.focus();
  };
  const handleKd = (e) => {
    kd(e, inRef);
  };
  const infoLines = [
    { label: "OS", value: device ? DEVICES[device].label : "terminallyonline.sh" },
    { label: "Host", value: device ? DEVICES[device].label : "Unknown" },
    { label: "Shell", value: "bash 5.2.15" },
    {
      label: "Progress",
      value: `${done.size}/${CHAPTERS.length} chapters (${pct}%)`,
      bar: true,
    },
    { label: "Commands", value: `${totalCmds} typed` },
    { label: "Streak", value: streak > 0 ? `${streak} days` : "0 days" },
    { label: "Steps", value: `${doneS}/${totalS} completed` },
    { label: "Terminal", value: "xterm-256color" },
    { label: "Packages", value: `${CHAPTERS.length} chapters` },
  ];

  /* ── Prompt helper ── */
  const promptColor = customPromptColor || activeTheme.accent;
  const Prompt = ({ cmd, dir }) => (
    <div style={{ marginBottom: 4 }}>
      <span style={{ color: promptColor, fontWeight: 700 }}>user@terminal</span>
      <span style={{ color: "#fff" }}>:</span>
      <span style={{ color: "#38bdf8", fontWeight: 600 }}>{dir || "~"}</span>
      <span style={{ color: "#fff" }}>$ </span>
      {cmd && <span style={{ color: "#f0f0f0" }}>{cmd}</span>}
      {!cmd && (
        <span
          style={{ color: "#666", animation: "tgBlink 1.2s step-end infinite" }}
        >
          █
        </span>
      )}
    </div>
  );

  /* ════════════════════════════════════════════════
     LEFT PANE — neofetch (menu), lesson info, or sandbox cheat sheet
     ════════════════════════════════════════════════ */
  const leftPane = sandboxActive ? (
    <div
      style={{
        width: mob ? "100%" : "40%",
        minWidth: mob ? undefined : 300,
        maxHeight: mob ? "40vh" : undefined,
        display: "flex",
        flexDirection: "column",
        borderRight: mob ? "none" : `1px solid ${activeTheme.border}`,
        borderBottom: mob ? `1px solid ${activeTheme.border}` : "none",
        flexShrink: mob ? 0 : 0,
        background: activeTheme.panelBg,
        fontFamily: activeFont,
        fontSize,
        transition: "background 0.4s ease, border-color 0.4s ease",
      }}
    >
      <div style={{ flex: 1, overflow: "auto", padding: mob ? "14px 16px" : "20px 24px", textAlign: "left" }}>
        {/* Back button */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <button
            onClick={() => setScreen("menu")}
            style={{
              background: "none", border: "1px solid #33333e", color: "#ccccccff",
              fontSize: 11, cursor: "pointer", padding: "3px 8px", borderRadius: 4, fontFamily: mono, flexShrink: 0,
            }}
          >
            ← <span style={{ color: "#666" }}>Esc</span>
          </button>
          <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Free Practice</span>
        </div>

        <div style={{ fontSize: fontSize - 3, fontWeight: 700, color: "#f9c74f", letterSpacing: "0.06em", marginBottom: 6 }}>
          VIRTUAL FILESYSTEM
        </div>
        <div style={{ marginBottom: 14, padding: "10px 12px", background: "#14141e", borderRadius: 6, border: "1px solid #282836" }}>
          <p style={{ fontSize: fontSize - 2, color: "#fff", lineHeight: 1.65, margin: 0 }}>
            {renderCode("A simulated Linux filesystem running in your browser. No real files are affected — experiment freely. Type `man <command>` to see what any command does.")}
          </p>
        </div>

        <div style={{ fontSize: fontSize - 3, fontWeight: 700, color: activeTheme.accent, letterSpacing: "0.06em", marginBottom: 8 }}>
          AVAILABLE COMMANDS
        </div>
        {(() => {
          const cmdDescs = {
            echo: "print text", whoami: "current user", hostname: "machine name", uname: "system info",
            pwd: "current directory", ls: "list files", cd: "change directory", mkdir: "create directory",
            touch: "create file", cp: "copy files", mv: "move/rename", rm: "delete files",
            find: "search for files", du: "disk usage", ln: "create symlink", tar: "archive files",
            zip: "compress files", unzip: "extract files", vim: "text editor", man: "manual pages",
            clear: "clear screen", history: "command history", sudo: "run as root",
            cat: "read file", head: "first lines", tail: "last lines / follow",
            less: "scroll through file", grep: "search text", wc: "count lines/words",
            diff: "compare files", sort: "sort lines", uniq: "unique lines",
            cut: "extract columns", awk: "text processing", sed: "find & replace",
            tee: "split output", xargs: "build commands",
            ps: "running processes", kill: "stop a process", top: "system monitor", htop: "system monitor",
            bg: "background a job", fg: "foreground a job", nohup: "persist after logout",
            jobs: "list background jobs", lsof: "open files", watch: "repeat a command",
            free: "memory usage", df: "disk space", uptime: "system uptime",
            chmod: "change permissions", chown: "change owner",
            alias: "command shortcut", ll: "alias for ls -la", source: "run a script",
            export: "set env variable", which: "locate a command",
            git: "version control", ssh: "remote connect", "ssh-keygen": "generate keys",
            "ssh-copy-id": "copy key to server", "ssh-add": "add key to agent",
            scp: "secure copy", rsync: "sync files",
            curl: "HTTP requests", wget: "download files", ping: "test connection",
            tmux: "terminal multiplexer", docker: "containers",
            systemctl: "manage services", journalctl: "service logs",
            "nvidia-smi": "GPU status", python: "run Python",
            node: "run Node.js", npm: "node packages", claude: "AI assistant",
          };
          let cmdNum = 1;
          return groups.map(g => (
            <div key={g.label}>
              {g.ids.map(id => {
                const c = CHAPTERS.find(c => c.id === id);
                if (!c) return null;
                const seen = new Set();
                const cmds = c.steps.map(s => {
                  const cmd = s.hint.split(/\s/)[0];
                  if (seen.has(cmd)) return null;
                  seen.add(cmd);
                  return cmd;
                }).filter(Boolean);
                if (!cmds.length) return null;
                return (
                  <div key={id} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: fontSize - 3, color: "#555", fontWeight: 600, marginBottom: 3 }}>{c.title}</div>
                    {cmds.map(cmd => {
                      const n = cmdNum++;
                      return (
                        <div key={cmd} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "1px 0" }}>
                          <span style={{ fontSize: fontSize - 3, color: "#444", width: 18, textAlign: "right", flexShrink: 0 }}>{n}.</span>
                          <span style={{ fontSize: fontSize - 2, color: "#ccc", flexShrink: 0 }}>{cmd}</span>
                          <span style={{ fontSize: fontSize - 3, color: "#555" }}>{cmdDescs[cmd] || ""}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ));
        })()}
      </div>
    </div>
  ) : lessonActive ? (
    <div
      style={{
        width: mob ? "100%" : "40%",
        minWidth: mob ? undefined : 300,
        maxHeight: mob ? "50vh" : undefined,
        display: "flex",
        flexDirection: "column",
        borderRight: mob ? "none" : `1px solid ${activeTheme.border}`,
        borderBottom: mob ? `1px solid ${activeTheme.border}` : "none",
        flexShrink: 0,
        background: activeTheme.panelBg,
        fontFamily: activeFont,
        fontSize,
        transition: "background 0.4s ease, border-color 0.4s ease",
      }}
    >
      <div
        ref={tutRef}
        style={{
          flex: 1,
          overflow: "auto",
          padding: mob ? "14px 16px" : "20px 24px",
          textAlign: "left",
        }}
      >
        {/* Back + chapter header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <button
            onClick={exitLesson}
            style={{
              background: "none",
              border: "1px solid #33333e",
              color: "#ccccccff",
              fontSize: 11,
              cursor: "pointer",
              padding: "3px 8px",
              borderRadius: 4,
              fontFamily: mono,
              flexShrink: 0,
            }}
          >
            ← <span style={{ color: "#666" }}>Esc</span>
          </button>
          <div style={{ flex: 1 }}></div>
          {/* Font size S/M/L */}
          <div style={{ display: "flex", gap: 2, marginRight: 6 }}>
            {[{ label: "S", size: 13 }, { label: "M", size: 15 }, { label: "L", size: 17 }].map(({ label, size }) => (
              <button
                key={label}
                onClick={() => setFontSizeTo(size)}
                title={`${size}px`}
                style={{
                  background: fontSize === size ? "#33333e" : "none",
                  border: "1px solid #33333e",
                  color: fontSize === size ? "#fff" : "#666",
                  fontSize: 10, cursor: "pointer", padding: "2px 6px", borderRadius: 3,
                  fontFamily: mono, lineHeight: 1, fontWeight: fontSize === size ? 700 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Progress dots */}
          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
            {ch.steps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background:
                    ch.mode === "challenge"
                      ? (completedSteps.has(i) ? activeTheme.accent : "#282832")
                      : i < maxStIdx
                        ? activeTheme.accent
                        : i === stIdx && !lessonDone
                          ? "#555"
                          : "#282832",
                  border:
                    i === stIdx && !lessonDone
                      ? "1px solid #4ade80"
                      : "1px solid transparent",
                }}
              />
            ))}
          </div>
        </div>

        {/* Teaching notes */}
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: activeTheme.accent,
            letterSpacing: "0.06em",
            marginBottom: 6,
          }}
        >
          CHAPTER INFO
        </div>

        <div
          style={{
            marginBottom: 16,
            padding: "10px 12px",
            background: "#14141e",
            borderRadius: 6,
            border: "1px solid #282836",
          }}
        >
          {ch.teach.map((p, i) => (
            <p
              key={i}
              style={{
                fontSize: fontSize - 2,
                color: "#fff",
                lineHeight: 1.65,
                margin: i === 0 ? 0 : "6px 0 0",
              }}
            >
              {renderCode(p)}
            </p>
          ))}
        </div>

        {/* Challenge mode: objective + checklist */}
        {ch.mode === "challenge" && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", letterSpacing: "0.06em", marginBottom: 6 }}>
              OBJECTIVES — {completedSteps.size}/{ch.steps.length}
            </div>
            {ch.objective && (
              <p style={{ fontSize: fontSize - 2, color: "#fbbf24", lineHeight: 1.65, marginBottom: 10, padding: "8px 10px", background: "#1a1708", borderRadius: 5, border: "1px solid #332f0a" }}>
                {ch.objective}
              </p>
            )}
            {ch.steps.map((s, i) => {
              const done = completedSteps.has(i);
              return (
                <div
                  key={i}
                  style={{
                    fontSize: fontSize - 2, color: done ? "#666" : "#ccc", padding: "5px 8px", marginBottom: 2,
                    borderLeft: done ? "2px solid #4ade80" : "2px solid #333",
                    opacity: done ? 0.6 : 1,
                    textDecoration: done ? "line-through" : "none",
                    borderRadius: "0 4px 4px 0",
                  }}
                >
                  <span style={{ color: done ? activeTheme.accent : "#555", marginRight: 6 }}>
                    {done ? "✓" : "○"}
                  </span>
                  {s.task}
                </div>
              );
            })}
            {/* Nudge (shown on Tab) */}
            {hint && (() => {
              const nextUncompleted = ch.steps.findIndex((_, i) => !completedSteps.has(i));
              const nudge = nextUncompleted >= 0 ? ch.steps[nextUncompleted].nudge : null;
              return nudge ? (
                <div style={{
                  fontSize: fontSize - 2, padding: "8px 12px", background: "#1a1708", border: "1px solid #332f0a",
                  borderRadius: 5, marginTop: 8, color: "#fbbf24", lineHeight: 1.6,
                }}>
                  💡 {nudge}
                </div>
              ) : null;
            })()}
            <div style={{ marginTop: 10, fontSize: 10, color: "#666" }}>
              <span style={{ color: activeTheme.accent }}>Tab</span> nudge · type <span style={{ fontFamily: mono, color: "#888" }}>solution</span> for answer
            </div>
          </div>
        )}

        {/* Guided mode: Completed steps */}
        {!ch.mode && maxStIdx > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: "0.06em", marginBottom: 6 }}>COMPLETED</div>
            {ch.steps.slice(0, maxStIdx).map((s, i) => (
              <div
                key={i}
                onClick={() => goToStep(i)}
                className="tg-completed-step"
                style={{
                  fontSize: fontSize - 2, color: i === stIdx ? "#fff" : "#666", padding: "4px 8px", marginBottom: 2,
                  borderLeft: i === stIdx ? "2px solid #4ade80" : "2px solid #1a2e1a",
                  opacity: i === stIdx ? 1 : 0.7,
                  cursor: "pointer", transition: "color 0.15s, opacity 0.15s",
                  background: i === stIdx ? "rgba(74, 222, 128, 0.05)" : "transparent",
                  borderRadius: "0 4px 4px 0",
                }}
              >
                <span style={{ color: activeTheme.accent, marginRight: 6 }}>&#10003;</span>
                {s.task}
              </div>
            ))}
          </div>
        )}

        {/* Task — the main instruction (guided mode only) */}
        {!lessonDone && st && !ch.mode && (
          <>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: activeTheme.accent,
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              YOUR TASK
            </div>

            <div
              style={{
                fontSize: 10,
                color: "#ccccccff",
                marginBottom: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ color: ch.color }}>
                STEP {stIdx + 1} <span style={{ color: "#666" }}>/</span>{" "}
                {ch.steps.length}
              </span>
            </div>

            <div
              style={{
                marginBottom: 10,
                padding: "10px 14px",
                background: `${activeTheme.accent}08`,
                borderRadius: 6,
                border: `1px solid ${activeTheme.accent}20`,
              }}
            >
              <div
                style={{
                  fontSize: fontSize + 2,
                  color: "#f0f0f0",
                  lineHeight: 1.55,
                  fontWeight: 600,
                }}
              >
                {renderCode(st.task)}
              </div>
            </div>

            {/* Learn context */}
            <div
              style={{
                fontSize: fontSize - 1,
                color: "#fff",
                lineHeight: 1.65,
                marginBottom: 10,
              }}
            >
              {renderCode(st.learn)}
            </div>

            {/* Settings Picker — Theme, Font, Size, and Prompt combined */}
            {st.type === "theme-picker" && (
              <div style={{ marginBottom: 12, padding: "10px 12px", background: "#14141e", borderRadius: 6, border: "1px solid #282836" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#c084fc", letterSpacing: "0.06em", marginBottom: 8 }}>TERMINAL SETTINGS</div>

                {/* Theme grid */}
                <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Theme</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 10 }}>
                  {Object.entries(THEMES).map(([key, t]) => (
                    <button key={key} onClick={() => setTpTheme(key)} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                      background: tpTheme === key ? t.bg : "transparent",
                      border: `1px solid ${tpTheme === key ? t.accent : "#33333e"}`,
                      borderRadius: 4, cursor: "pointer", width: "100%", textAlign: "left",
                    }}>
                      <span style={{ width: 16, height: 16, borderRadius: 3, background: t.bg, border: `1px solid ${t.border}`, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.accent }} />
                      </span>
                      <span style={{ fontSize: 11, color: tpTheme === key ? t.textBright : "#888", fontFamily: mono }}>{t.name}</span>
                      {tpTheme === key && <span style={{ marginLeft: "auto", color: t.accent, fontSize: 10 }}>●</span>}
                    </button>
                  ))}
                </div>

                {/* Font picker */}
                <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Font</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 10 }}>
                  {Object.entries(FONTS).map(([key, f]) => (
                    <button key={key} onClick={() => setTpFont(key)} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                      background: tpFont === key ? "#2a2a3a" : "transparent",
                      border: `1px solid ${tpFont === key ? activeTheme.accent : "#33333e"}`,
                      borderRadius: 4, cursor: "pointer", width: "100%", textAlign: "left",
                    }}>
                      <span style={{ fontSize: 11, color: tpFont === key ? "#fff" : "#888", fontFamily: f.family }}>{f.name}</span>
                      {f.ligatures && <span style={{ fontSize: 9, color: "#666", fontFamily: mono }}>ligatures</span>}
                      {tpFont === key && <span style={{ marginLeft: "auto", color: activeTheme.accent, fontSize: 10 }}>●</span>}
                    </button>
                  ))}
                </div>

                {/* Text size */}
                <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Text Size</div>
                <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                  {[{ label: "S", size: 13 }, { label: "M", size: 15 }, { label: "L", size: 17 }].map(({ label, size }) => (
                    <button
                      key={label}
                      onClick={() => setFontSizeTo(size)}
                      style={{
                        flex: 1, padding: "6px 0", textAlign: "center",
                        background: fontSize === size ? "#2a2a3a" : "transparent",
                        border: `1px solid ${fontSize === size ? activeTheme.accent : "#33333e"}`,
                        color: fontSize === size ? "#fff" : "#888",
                        fontSize: 11, cursor: "pointer", borderRadius: 4,
                        fontFamily: mono, fontWeight: fontSize === size ? 700 : 400,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Prompt Builder */}
                <div style={{ marginTop: 4, paddingTop: 10, borderTop: "1px solid #282836" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#c084fc", letterSpacing: "0.06em", marginBottom: 8 }}>PROMPT</div>

                  {/* Emoji picker */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Prefix</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {PS1_EMOJIS.map(e => (
                        <button key={e} onClick={() => setPbEmoji(e === pbEmoji ? "" : e)} style={{
                          background: e === pbEmoji ? "#2a2a3a" : "transparent", border: "1px solid #33333e",
                          color: "#fff", fontSize: 14, cursor: "pointer", padding: "4px 8px", borderRadius: 4,
                        }}>{e}</button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                    {[
                      ["Username", pbShowUser, setPbShowUser],
                      ["Hostname", pbShowHost, setPbShowHost],
                      ["Timestamp", pbShowTime, setPbShowTime],
                    ].map(([label, val, setter]) => (
                      <label key={label} style={{ fontSize: 10, color: "#aaa", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        <input type="checkbox" checked={val} onChange={() => setter(!val)} style={{ accentColor: activeTheme.accent }} />
                        {label}
                      </label>
                    ))}
                  </div>

                  {/* Directory mode */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Directory</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[["full", "Full path"], ["basename", "Folder only"]].map(([val, label]) => (
                        <button key={val} onClick={() => setPbDirMode(val)} style={{
                          background: pbDirMode === val ? "#2a2a3a" : "transparent", border: "1px solid #33333e",
                          color: pbDirMode === val ? "#fff" : "#888", fontSize: 10, cursor: "pointer", padding: "4px 8px", borderRadius: 4, fontFamily: mono,
                        }}>{label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Color picker */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Color</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {Object.entries(PS1_COLORS).map(([key, { label, hex }]) => (
                        <button key={key} onClick={() => setPbColor(key)} style={{
                          background: pbColor === key ? hex + "33" : "transparent", border: `1px solid ${pbColor === key ? hex : "#33333e"}`,
                          color: hex, fontSize: 10, cursor: "pointer", padding: "4px 8px", borderRadius: 4, fontFamily: mono,
                        }}>{label}</button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Hint */}
            {hint && !st.type && (
              <div
                style={{
                  fontSize,
                  padding: "8px 12px",
                  background: "#0f1a14",
                  border: "1px solid #1a2e1a",
                  borderRadius: 5,
                  marginBottom: 10,
                  fontFamily: mono,
                }}
              >
                <span style={{ color: activeTheme.accent }}>$ </span>
                <span style={{ color: activeTheme.accent, fontWeight: 600 }}>
                  {st.hint}
                </span>
              </div>
            )}

            <div
              style={{
                fontSize: 11,
                color: "#fff",
                paddingTop: 10,
                borderTop: "1px solid #282836",
              }}
            >
              <span style={{ color: "#888", fontSize: 10, fontFamily: mono }}>
                man &lt;cmd&gt;
              </span>{" "}
              <span style={{ color: "#666", fontSize: 10 }}>look up any command</span>
              <br />
              <span style={{ color: activeTheme.accent, fontSize: 10, fontWeight: 600 }}>
                Tab
              </span>{" "}
              {hint ? "hide" : "show"} hint
              <span style={{ color: "#444", margin: "0 8px" }}>|</span>
              <span style={{ color: "#fff", fontSize: 10 }}>↑↓</span> history
            </div>
          </>
        )}

        {/* Lesson complete — summary */}
        {lessonDone && (
          <div>
            <div
              style={{
                fontSize: fontSize + 2,
                color: activeTheme.accent,
                fontWeight: 700,
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>✓ {ch.title} complete</span>
            </div>

            <p
              style={{
                fontSize: fontSize - 1,
                color: "#ccccccff",
                margin: "0 0 12px",
                lineHeight: 1.5,
              }}
            >
              {ch.steps.length} steps completed — commands learned:
            </p>

            {/* Commands summary grid */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 14,
                padding: "10px 12px",
                background: "#14141e",
                borderRadius: 6,
                border: "1px solid #282836",
                overflow: "hidden",
              }}
            >
              {ch.steps.map((s, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: fontSize - 2,
                    fontFamily: mono,
                    color: activeTheme.accent,
                    background: "#0f1a14",
                    border: "1px solid #1a2e1a",
                    padding: "3px 8px",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.hint}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => restartCh(chIdx)}
                style={{
                  background: "none",
                  border: "1.5px solid #33333e",
                  color: "#fff",
                  fontSize: 12,
                  cursor: "pointer",
                  padding: "8px 14px",
                  borderRadius: 6,
                  fontFamily: mono,
                }}
              >
                Restart Chapter
              </button>

              {chIdx < CHAPTERS.length - 1 && (
                <button
                  onClick={() => startCh(chIdx + 1)}
                  style={{
                    background: "#0f1f0f",
                    border: "1.5px solid #1f3a1f",
                    color: activeTheme.accent,
                    fontSize: 12,
                    cursor: "pointer",
                    padding: "8px 14px",
                    borderRadius: 6,
                    fontFamily: mono,
                    fontWeight: 700,
                  }}
                >
                  Next: {CHAPTERS[chIdx + 1].title} →
                </button>
              )}

            </div>
          </div>
        )}
      </div>

      {/* Bottom bar — back + skip */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: mob ? "8px 16px" : "8px 24px",
          borderTop: "1px solid #282836",
          flexShrink: 0,
        }}
      >
        {stIdx > 0 && (
          <button
            onClick={goBack}
            style={{
              background: "none",
              border: "1px solid #33333e",
              color: "#888",
              fontSize: 11,
              cursor: "pointer",
              padding: "4px 10px",
              borderRadius: 4,
              fontFamily: mono,
            }}
          >
            back
          </button>
        )}

        {!lessonDone && st && (
          <button
            onClick={skip}
            style={{
              background: "none",
              border: "1px solid #33333e",
              color: "#888",
              fontSize: 11,
              cursor: "pointer",
              padding: "4px 10px",
              borderRadius: 4,
              fontFamily: mono,
            }}
          >
            skip
          </button>
        )}
      </div>
    </div>
  ) : (
    /* ── Menu left pane: neofetch ── */
    <div
      style={{
        width: mob ? "100%" : "40%",
        minWidth: mob ? undefined : 300,
        overflow: mob ? "visible" : "auto",
        borderRight: mob ? "none" : `1px solid ${activeTheme.border}`,
        borderBottom: mob ? `1px solid ${activeTheme.border}` : "none",
        flexShrink: 0,
        background: activeTheme.panelBg,
        fontFamily: activeFont,
        fontSize,
        transition: "background 0.4s ease, border-color 0.4s ease",
      }}
    >
      <div style={{ padding: mob ? "14px 16px 8px" : "20px 24px 0 24px" }}>
        <Prompt cmd="neofetch" />
      </div>
      { (
        <div
          style={{
            marginTop: 12,
            marginBottom: 16,
            padding: mob ? "14px 16px 8px" : "0 24px",
          }}
        >
          <pre
            style={{
              margin: "auto",
              padding: 0,
              background: "transparent",
              fontSize: fontSize - 2,
              lineHeight: 1.3,
              color: activeTheme.accent,
              userSelect: "none",
              marginBottom: 16,
              textAlign: "center",
              overflow: "hidden",
            }}
          >
            {ASCII_ART.join("\n")}
          </pre>

          <div style={{ fontSize: fontSize - 1, lineHeight: 1.9 }}>
            <div>
              <span style={{ color: promptColor, fontWeight: 700 }}>
                user@terminal
              </span>
            </div>
            <div
              style={{
                borderBottom: "1px solid #33333e",
                marginBottom: 4,
                paddingBottom: 2,
              }}
            />
            {infoLines.map((l, i) => (
              <div
                key={i}
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                <span style={{ color: promptColor, fontWeight: 700 }}>
                  {l.label}
                </span>
                <span style={{ color: "#fff" }}>: </span>
                <span style={{ color: "#f0f0f0" }}>{l.value}</span>
                {l.bar && (
                  <span
                    style={{ marginLeft: 6, fontSize: 10, letterSpacing: 1 }}
                  >
                    <span style={{ color: promptColor }}>
                      {"█".repeat(filled)}
                    </span>
                    <span style={{ color: "#33333e" }}>
                      {"░".repeat(barWidth - filled)}
                    </span>
                  </span>
                )}
              </div>
            ))}
            <div style={{ marginTop: 8, display: "flex", gap: 0 }}>
              {colorBlocks.map((c, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 10,
                    background: c,
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", gap: 0 }}>
              {colorBlocks.map((c, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 10,
                    background: c,
                    opacity: 0.5,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {mob && (
        <div
          style={{
            marginTop: 8,
            marginBottom: 12,
            padding: "0 16px",
            fontSize: 11,
            lineHeight: 1.8,
          }}
        >
          <div>
            <span style={{ color: promptColor, fontWeight: 700 }}>
              user@terminal
            </span>
          </div>
          <div
            style={{
              borderBottom: "1px solid #33333e",
              marginBottom: 4,
              paddingBottom: 2,
            }}
          />
          <div>
            <span style={{ color: promptColor, fontWeight: 700 }}>OS</span>
            <span style={{ color: "#fff" }}>: </span>
            <span style={{ color: "#f0f0f0" }}>terminallyonline.sh</span>
          </div>
          <div>
            <span style={{ color: promptColor, fontWeight: 700 }}>Progress</span>
            <span style={{ color: "#fff" }}>: </span>
            <span style={{ color: "#f0f0f0" }}>
              {done.size}/{CHAPTERS.length} ({pct}%)
            </span>
          </div>
          <div>
            <span style={{ color: promptColor, fontWeight: 700 }}>Commands</span>
            <span style={{ color: "#fff" }}>: </span>
            <span style={{ color: "#f0f0f0" }}>{totalCmds} typed</span>
          </div>
          <div style={{ marginTop: 6, display: "flex", gap: 0 }}>
            {colorBlocks.map((c, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 8,
                  background: c,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: mob ? "14px 16px 8px" : "0 24px" }}>
        <div
          style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}
        >
          <button
            onClick={() => setShowInfo(true)}
            style={{
              background: "none",
              border: "1px solid #33333e",
              color: "#aaa",
              fontSize: 11,
              cursor: "pointer",
              padding: "4px 10px",
              borderRadius: 5,
              fontFamily: mono,
              minHeight: 28,
            }}
          >
            ? help
          </button>
          <button
            onClick={() => setScreen("setup")}
            style={{
              background: "none",
              border: "1px solid #33333e",
              color: "#aaa",
              fontSize: 11,
              cursor: "pointer",
              padding: "4px 10px",
              borderRadius: 5,
              fontFamily: mono,
              minHeight: 28,
            }}
          >
            {DEVICES[device]?.icon} {DEVICES[device]?.label}
          </button>
          {allComplete && (
            <button
              onClick={() => setShowShare(true)}
              style={{
                background: "#0f1a14",
                border: "1px solid #1f3a1f",
                color: activeTheme.accent,
                fontSize: 11,
                cursor: "pointer",
                padding: "4px 10px",
                borderRadius: 5,
                fontFamily: mono,
                minHeight: 28,
                fontWeight: 600,
              }}
            >
              share ✓
            </button>
          )}
        </div>

        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px solid #1e1e2a",
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          <a
            href="https://buymeacoffee.com/tomaslawton"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 10,
              color: "#666",
              textDecoration: "none",
              fontFamily: mono,
            }}
          >
            ☕ support
          </a>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════
     RIGHT PANE — chapter list (menu), terminal (lesson), or sandbox
     ════════════════════════════════════════════════ */
  const rightPane = sandboxActive ? (
    <SandboxScreen mob={mob} activeTheme={activeTheme} activeFont={activeFont} fontSize={fontSize} onCompleteAll={() => {
      const allDone = new Set(CHAPTERS.map((_, i) => i));
      setDone(allDone);
      saveProgress(allDone, getTotalCommands());
      CHAPTERS.forEach((_, i) => saveStepProgress(i, CHAPTERS[i].steps.length));
      setScreen("menu");
    }} />
  ) : lessonActive ? (
    <div
      style={{
        flex: 1,
        minHeight: mob ? "50vh" : undefined,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: activeTheme.bg,
        fontFamily: activeFont,
        fontSize,
        transition: "background 0.3s, font-family 0.2s",
      }}
      onClick={handleFocus}
    >
      {/* Terminal prompt area */}
      <div
        ref={scRef}
        style={{
          flex: 1,
          overflow: "auto",
          padding: mob ? "14px 16px" : "20px 24px",
          fontSize: fontSize,
          lineHeight: 1.6,
        }}
      >
        {/* History */}
        {hist.map((e, i) => (
          <div
            key={i}
            style={{
              marginBottom:
                e.t === "note" || e.t === "done" || e.t === "help" ? 10 : 2,
            }}
          >
            {e.t === "in" && (() => {
              const d = e.dir === "/home/ubuntu" ? "~" : e.dir?.startsWith("/home/ubuntu/") ? "~" + e.dir.slice(12) : e.dir || "~";
              const customP = !mob && buildPromptFromConfig(d);
              return (
                <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
                  <span
                    style={{
                      color: customPromptColor || activeTheme.prompt,
                      whiteSpace: "pre",
                      fontWeight: 600,
                      marginRight: 4,
                    }}
                  >
                    {mob ? "$" : (customP || `ubuntu@server:${d}$`)}{" "}
                  </span>
                  <span style={{ color: e.v ? activeTheme.textBright : "transparent" }}>
                    {e.v || "."}
                  </span>
                </div>
              );
            })()}
            {e.t === "out" && (
              <pre
                style={{
                  margin: "2px 0 4px",
                  padding: 0,
                  background: "transparent",
                  fontSize: "inherit",
                  lineHeight: 1.6,
                  color: activeTheme.text,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  textAlign: "left",
                }}
              >
                {e.v}
              </pre>
            )}
            {e.t === "colored-ls" && (
              <pre
                style={{
                  margin: "2px 0 4px", padding: 0, background: "transparent",
                  fontSize: "inherit", lineHeight: 1.6, whiteSpace: "pre-wrap", textAlign: "left",
                }}
              >
                <span style={{ color: "#00d4ff", fontWeight: 700 }}>project/</span>{"  "}
                <span style={{ color: "#00d4ff", fontWeight: 700 }}>scripts/</span>{"  "}
                <span style={{ color: "#fabd2f" }}>train.py</span>{"  "}
                <span style={{ color: "#fabd2f" }}>utils.py</span>{"  "}
                <span style={{ color: activeTheme.accent }}>README.md</span>{"  "}
                <span style={{ color: activeTheme.accent }}>notes.md</span>{"  "}
                <span style={{ color: "#ff6b6b" }}>deploy.sh</span>{"  "}
                <span style={{ color: "#ff6b6b" }}>backup.sh</span>
              </pre>
            )}
            {e.t === "ansi" && (
              <pre
                style={{
                  margin: "2px 0 4px", padding: 0, background: "transparent",
                  fontSize: "inherit", lineHeight: 1.6, whiteSpace: "pre-wrap", textAlign: "left",
                  color: e.color || activeTheme.accent, fontWeight: 700,
                }}
              >
                {e.v}
              </pre>
            )}
            {e.t === "note" && (
              <div
                style={{
                  padding: "6px 10px",
                  marginTop: 4,
                  background: activeTheme.noteBg || "#0d1a0d",
                  borderRadius: "0 4px 4px 0",
                  color: activeTheme.noteText || "#8cd98c",
                }}
              >
                {renderCode(e.v)}
              </div>
            )}
            {e.t === "err" && (
              <div style={{ color: "#ff6b6b", padding: "2px 0" }}>{e.v}</div>
            )}
            {e.t === "done" && (
              <div
                style={{ color: activeTheme.accent, padding: "8px 0", fontWeight: 700 }}
              >
                ✓ {e.v} — complete
              </div>
            )}
            {e.t === "help" && (
              <pre
                style={{
                  margin: "2px 0",
                  padding: 0,
                  background: "transparent",
                  fontSize: "inherit",
                  lineHeight: 1.6,
                  color: "#ccccccff",
                  whiteSpace: "pre-wrap",
                }}
              >
                {`  Tab     toggle hint
  ↑ ↓     command history
  skip    skip current step
  clear   reset output
  help    this message`}
              </pre>
            )}
          </div>
        ))}

        {/* Active prompt */}
        {!lessonDone && st && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              animation: shake ? "tgShake 0.4s ease" : "none",
              marginTop: hist.length > 0 ? 4 : 0,
            }}
          >
            {isCtrlStep ? (
              <>
                <span style={{ color: "#f97316", fontSize: "inherit", fontFamily: mono, animation: "tgPulse 1.5s ease-in-out infinite" }}>
                  ● process running
                </span>
                {/* Hidden input to capture keystrokes */}
                <input
                  ref={inRef}
                  type="text"
                  value={input}
                  onChange={() => {}}
                  onKeyDown={handleKd}
                  style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                />
              </>
            ) : (
              <>
                <span style={{ color: customPromptColor || activeTheme.prompt, fontWeight: 700, marginRight: 8, fontSize: mob ? 16 : fontSize }}>
                  {prompt}{" "}
                </span>
                <input
                  ref={inRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKd}
                  onClick={(e) => e.stopPropagation()}
                  placeholder=""
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: activeTheme.textBright,
                    fontSize: mob ? 16 : fontSize,
                    fontFamily: activeFont,
                    padding: mob ? "8px 0" : "4px 0",
                    caretColor: customPromptColor || activeTheme.prompt,
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Done — free-play input */}
        {lessonDone && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: hist.length > 0 ? 4 : 0,
            }}
          >
            <span style={{ color: activeTheme.accent, fontWeight: 700, marginRight: 8, fontSize: mob ? 16 : fontSize }}>
              {prompt}{" "}
            </span>
            <input
              ref={inRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKd}
              onClick={(e) => e.stopPropagation()}
              placeholder=""
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#f0f0f0",
                fontSize: mob ? 16 : fontSize,
                fontFamily: mono,
                padding: mob ? "8px 0" : "4px 0",
                caretColor: activeTheme.accent,
              }}
            />
          </div>
        )}
      </div>
    </div>
  ) : (
    /* ── Menu right pane: chapter list ── */
    <div
      style={{
        flex: mob ? "none" : 1,
        overflow: mob ? "visible" : "auto",
        padding: mob ? "12px 12px" : "20px 24px",
        fontFamily: activeFont,
        fontSize,
      }}
    >
      <Prompt cmd="ls ./chapters/" />

      <div style={{ marginTop: 12 }}>
        {groups.map((g) => (
          <div key={g.label} style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 2,
                paddingLeft: 4,
              }}
            >
              <span
                style={{
                  fontSize: fontSize - 2,
                  fontWeight: 700,
                  color: g.color,
                  letterSpacing: "0.04em",
                }}
              >
                // {g.label}
              </span>
            </div>
            {g.ids.map((id) => {
              const ci = CHAPTERS.findIndex((c) => c.id === id);
              const c = CHAPTERS[ci];
              const d = done.has(ci);
              const mi = menuItems.findIndex(
                (m) => m.type === "chapter" && m.idx === ci,
              );
              const active = navIdx === mi;
              const isFun = id === "custom";
              return (
                <button
                  key={id}
                  onClick={() => startCh(ci)}
                  onMouseEnter={() => setNavIdx(mi)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: active
                      ? (isFun ? "rgba(167, 139, 250, 0.08)" : "#1a1a26")
                      : (isFun ? "rgba(167, 139, 250, 0.03)" : "transparent"),
                    border: active
                      ? `1px solid ${isFun ? "rgba(167, 139, 250, 0.3)" : "#363644"}`
                      : `1px solid ${isFun ? "rgba(167, 139, 250, 0.1)" : "transparent"}`,
                    borderRadius: 6,
                    padding: mob ? "7px 6px" : "7px 10px",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "all 0.1s",
                    fontFamily: mono,
                    color: "#f0f0f0",
                    outline: "none",
                    minHeight: 36,
                    boxSizing: "border-box",
                  }}
                >
                  <span
                    style={{
                      fontSize: fontSize - 2,
                      color: d ? activeTheme.accent : active ? activeTheme.accent : "#666",
                      width: 18,
                      textAlign: "right",
                      flexShrink: 0,
                      fontWeight: 700,
                    }}
                  >
                    {d ? "✓" : ci + 1}
                  </span>
                  <span
                    style={{
                      fontSize,
                      flexShrink: 0,
                      width: 18,
                      textAlign: "center",
                    }}
                  >
                    {c.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize,
                        fontWeight: 600,
                        color: active ? g.color : "#ddd",
                      }}
                    >
                      {c.title}
                    </span>

                    {!mob && (
                      <span
                        style={{ fontSize: fontSize - 2, color: "#777", marginLeft: 8 }}
                      >
                        {c.desc}
                      </span>
                    )}
                  </div>
                  {isFun && !d && (
                    <span style={{
                      fontSize: 8, fontWeight: 700, color: "#a78bfa",
                      background: "rgba(167, 139, 250, 0.1)",
                      padding: "2px 5px", borderRadius: 3,
                      border: "1px solid rgba(167, 139, 250, 0.2)",
                      letterSpacing: "0.04em", flexShrink: 0,
                    }}>FUN</span>
                  )}
                  <span style={{ fontSize: fontSize - 3, color: "#666", flexShrink: 0 }}>
                    {c.steps.length}
                  </span>
                </button>
              );
            })}
          </div>
        ))}

        {/* Sandbox — Free Practice */}
        {(() => {
          const sbActive = navIdx === menuItems.length - 1;
          return (
            <div style={{ marginTop: 8, paddingTop: 12, borderTop: `1px solid ${activeTheme.border}` }}>
              <button
                onClick={() => setScreen("sandbox")}
                onMouseEnter={() => setNavIdx(menuItems.length - 1)}
                style={{
                  width: "100%",
                  background: sbActive ? "rgba(56, 189, 248, 0.06)" : "rgba(56, 189, 248, 0.02)",
                  border: sbActive ? "1px solid rgba(56, 189, 248, 0.25)" : "1px dashed rgba(56, 189, 248, 0.15)",
                  borderRadius: 6,
                  padding: mob ? "10px 10px" : "10px 12px",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: mono,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: "#f0f0f0",
                  transition: "all 0.1s",
                  outline: "none",
                  minHeight: 40,
                  boxSizing: "border-box",
                }}
              >
                <span style={{ fontSize: fontSize + 2, flexShrink: 0 }}>⟩_</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize, fontWeight: 600, color: "#38bdf8" }}>
                    Free Practice
                  </div>
                  <div style={{ fontSize: fontSize - 3, color: "#666", marginTop: 2 }}>
                    Open sandbox — experiment freely
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#38bdf8",
                    background: "rgba(56, 189, 248, 0.1)",
                    padding: "2px 6px",
                    borderRadius: 3,
                    border: "1px solid rgba(56, 189, 248, 0.2)",
                    letterSpacing: "0.04em",
                  }}
                >
                  SANDBOX
                </span>
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════
     RENDER — terminal chrome wrapping both panes
     ════════════════════════════════════════════════ */
  return (
    <div
      style={{
        height: "100dvh",
        color: "#c8c8c8",
        fontFamily: mono,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: mob ? activeTheme.bg : activeTheme.outerBg,
        transition: "background 0.6s ease",
      }}
    >
      {showOnboarding && !lessonActive && !sandboxActive && (
        <OnboardingModal mob={mob} onClose={() => { localStorage.setItem("tol_onboarded", "1"); setShowOnboarding(false); }} />

      )}
      {showInfo && <InfoModal mob={mob} onClose={() => setShowInfo(false)} onReset={() => { resetAllProgress(); setDone(new Set()); shownSections.current = new Set(); setShowOnboarding(true); }} />}
      {showShare && (
        <ShareCard mob={mob} done={done} title={graduationTitle} onClose={() => { setShowShare(false); setGraduationTitle(null); }} />
      )}


      {/* Terminal chrome */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          margin: mob ? 0 : "42px",
          borderRadius: mob ? 0 : 12,
          border: mob ? "none" : `1px solid ${activeTheme.chromeBorder}`,
          boxShadow: mob
            ? "none"
            : "0 20px 60px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)",
          background: activeTheme.bg,
          transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 14px",
            background: activeTheme.titleBar,
            borderBottom: `1px solid ${activeTheme.titleBorder}`,
            transition: "background 0.4s ease, border-color 0.4s ease",
            borderRadius: mob ? 0 : "12px 12px 0 0",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: activeTheme.dot, transition: "background 0.4s ease" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: activeTheme.dot, transition: "background 0.4s ease" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: activeTheme.dot, transition: "background 0.4s ease" }} />
          </div>
         {(lessonActive || sandboxActive) ? ( <span
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 11,
              fontWeight: 500,
              color: "#ffffffff",
              marginRight: 34,
            }}
          >
            {sandboxActive ? "Free Practice — Sandbox" : `Chapter — ${ch.title}`}
          </span>) : (
            <p
            style={{
              color: "#f0f0f0",
               flex: 1,
              textAlign: "center",
              fontSize: 11,
              fontWeight: 500,
              marginRight: 34,
            }}
          >
            terminally<span style={{ color: activeTheme.prompt }}>online</span>
            <span style={{ color: "#666" }}>.sh</span>
          </p>
          )}
        </div>

        {/* Body — split left/right */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: mob ? "column" : "row",
            overflow: mob ? "auto" : "hidden",
            background: activeTheme.bg,
            transition: "background 0.4s ease",
          }}
        >
          {leftPane}
          {rightPane}
        </div>
      </div>
    </div>
  );
}

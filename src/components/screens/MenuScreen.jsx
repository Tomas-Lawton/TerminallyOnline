import { useMemo, useRef, useEffect, useState } from "react";
import { CHAPTERS } from "@/data/chapters";
import { DEVICES } from "@/data/devices";
import { getStreak, getTotalCommands, resetAllProgress } from "@/utils/progress";
import { renderCode } from "@/utils/helpers";
import InfoModal from "../ui/InfoModal";
import ShareCard from "../ui/ShareCard";
import SandboxScreen from "./SandboxScreen";
import "@/styles/terminal.css";

const mono =
  "'SF Mono','Fira Code','JetBrains Mono','Menlo','Consolas',monospace";
const bg = "#191922";
const FS = 13;

const groups = [
  { label: "Getting Started", color: "#f9c74f", ids: ["basics", "files", "perm", "read", "pipe", "tools"], summary: "You've learned the shell, file management, navigation, reading files, searching with grep, data pipelines with pipes, and file permissions." },
  { label: "System & Tools", color: "#f97316", ids: ["sys", "git", "ssh"], summary: "You've mastered system monitoring, version control with git, and remote access with SSH." },
  { label: "Infrastructure", color: "#ef4444", ids: ["docker", "nginx", "boss"], summary: "You've conquered Docker, Nginx, and handled a production incident under pressure. You're ready for real-world infrastructure." },
  { label: "Bonus", color: "#a78bfa", ids: ["ai"], summary: "You've learned how to use AI tools in the terminal. The future is here." },
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

const colorBlocks = [
  "#3a3aae",
  "#e06060",
  "#4ade80",
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
}) {
  const inRef = useRef(null);
  const scRef = useRef(null);
  const tutRef = useRef(null);
  const [showShare, setShowShare] = useState(false);
  const [sectionModal, setSectionModal] = useState(null);
  const shownSections = useRef(new Set(JSON.parse(localStorage.getItem("tol_sections_done") || "[]")));

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
        // If still in a lesson, exit first then show modal after a brief delay
        if (lessonActive) {
          exitLesson();
          setTimeout(() => setSectionModal(g), 300);
        } else {
          setSectionModal(g);
        }
        break;
      }
    }
  }, [done, lessonActive, exitLesson]);

  // Auto-show certificate when all chapters complete
  useEffect(() => {
    const allDone = done.size >= CHAPTERS.length;
    if (!allDone) return;
    const alreadyShown = localStorage.getItem("tol_cert_shown");
    if (alreadyShown) return;
    // Delay so it doesn't overlap with section completion modal
    const timer = setTimeout(() => {
      localStorage.setItem("tol_cert_shown", "1");
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

  const cwdDisplay =
    cwd === "/home/ubuntu"
      ? "~"
      : cwd?.startsWith("/home/ubuntu/")
        ? "~" + cwd.slice(12)
        : cwd || "~";
  const prompt = mob ? "$" : `ubuntu@server:${cwdDisplay}$`;

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
  const Prompt = ({ cmd, dir }) => (
    <div style={{ marginBottom: 4 }}>
      <span style={{ color: "#4ade80", fontWeight: 700 }}>user@terminal</span>
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
        borderRight: mob ? "none" : "1px solid #222230",
        borderBottom: mob ? "1px solid #222230" : "none",
        flexShrink: mob ? 0 : 0,
        background: "#1a1a26",
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

        <div style={{ fontSize: 10, fontWeight: 700, color: "#f9c74f", letterSpacing: "0.06em", marginBottom: 6 }}>
          VIRTUAL FILESYSTEM
        </div>
        <div style={{ fontSize: 11, color: "#999", marginBottom: 14, lineHeight: 1.55 }}>
          A simulated Linux filesystem running in your browser. No real files are affected — experiment freely.
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", letterSpacing: "0.06em", marginBottom: 8 }}>
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
                    <div style={{ fontSize: 10, color: "#555", fontWeight: 600, marginBottom: 3 }}>{c.title}</div>
                    {cmds.map(cmd => {
                      const n = cmdNum++;
                      return (
                        <div key={cmd} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "1px 0" }}>
                          <span style={{ fontSize: 10, color: "#444", width: 18, textAlign: "right", flexShrink: 0 }}>{n}.</span>
                          <span style={{ fontSize: 11, fontFamily: mono, color: "#ccc", flexShrink: 0 }}>{cmd}</span>
                          <span style={{ fontSize: 10, color: "#555" }}>{cmdDescs[cmd] || ""}</span>
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
        borderRight: mob ? "none" : "1px solid #222230",
        borderBottom: mob ? "1px solid #222230" : "none",
        flexShrink: 0,
        background: "#1a1a26",
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
                    i < maxStIdx
                      ? "#4ade80"
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
            color: "#4ade80",
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
                fontSize: 11,
                color: "#fff",
                lineHeight: 1.65,
                margin: i === 0 ? 0 : "6px 0 0",
              }}
            >
              {renderCode(p)}
            </p>
          ))}
        </div>

        {/* Completed steps */}
        {maxStIdx > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: "0.06em", marginBottom: 6 }}>COMPLETED</div>
            {ch.steps.slice(0, maxStIdx).map((s, i) => (
              <div
                key={i}
                onClick={() => goToStep(i)}
                className="tg-completed-step"
                style={{
                  fontSize: 11, color: i === stIdx ? "#fff" : "#666", padding: "4px 8px", marginBottom: 2,
                  borderLeft: i === stIdx ? "2px solid #4ade80" : "2px solid #1a2e1a",
                  opacity: i === stIdx ? 1 : 0.7,
                  cursor: "pointer", transition: "color 0.15s, opacity 0.15s",
                  background: i === stIdx ? "rgba(74, 222, 128, 0.05)" : "transparent",
                  borderRadius: "0 4px 4px 0",
                }}
              >
                <span style={{ color: "#4ade80", marginRight: 6 }}>&#10003;</span>
                {s.task}
              </div>
            ))}
          </div>
        )}

        {/* Task — the main instruction */}
        {!lessonDone && st && (
          <>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#4ade80",
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
                background: "#0d1a12",
                borderRadius: 6,
                border: "1px solid #1a2e1a",
              }}
            >
              <div
                style={{
                  fontSize: 15,
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
                fontSize: 12,
                color: "#fff",
                lineHeight: 1.65,
                marginBottom: 10,
              }}
            >
              {renderCode(st.learn)}
            </div>

            {/* Hint */}
            {hint && (
              <div
                style={{
                  fontSize: FS,
                  padding: "8px 12px",
                  background: "#0f1a14",
                  border: "1px solid #1a2e1a",
                  borderRadius: 5,
                  marginBottom: 10,
                  fontFamily: mono,
                }}
              >
                <span style={{ color: "#4ade80" }}>$ </span>
                <span style={{ color: "#4ade80", fontWeight: 600 }}>
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
              <span style={{ color: "#4ade80", fontSize: 10, fontWeight: 600 }}>
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
                fontSize: 15,
                color: "#4ade80",
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
                fontSize: 12,
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
                    fontSize: 11,
                    fontFamily: mono,
                    color: "#4ade80",
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
                    color: "#4ade80",
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
        borderRight: mob ? "none" : "1px solid #222230",
        borderBottom: mob ? "1px solid #222230" : "none",
        flexShrink: 0,
        background: "#1a1a26",
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
              fontSize: 11,
              lineHeight: 1.3,
              color: "#4ade80",
              userSelect: "none",
              marginBottom: 16,
              textAlign: "center",
              overflow: "hidden",
            }}
          >
            {ASCII_ART.join("\n")}
          </pre>

          <div style={{ fontSize: 12, lineHeight: 1.9 }}>
            <div>
              <span style={{ color: "#4ade80", fontWeight: 700 }}>
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
                <span style={{ color: "#4ade80", fontWeight: 700 }}>
                  {l.label}
                </span>
                <span style={{ color: "#fff" }}>: </span>
                <span style={{ color: "#f0f0f0" }}>{l.value}</span>
                {l.bar && (
                  <span
                    style={{ marginLeft: 6, fontSize: 10, letterSpacing: 1 }}
                  >
                    <span style={{ color: "#4ade80" }}>
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
            <span style={{ color: "#4ade80", fontWeight: 700 }}>
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
            <span style={{ color: "#4ade80", fontWeight: 700 }}>OS</span>
            <span style={{ color: "#fff" }}>: </span>
            <span style={{ color: "#f0f0f0" }}>terminallyonline.sh</span>
          </div>
          <div>
            <span style={{ color: "#4ade80", fontWeight: 700 }}>Progress</span>
            <span style={{ color: "#fff" }}>: </span>
            <span style={{ color: "#f0f0f0" }}>
              {done.size}/{CHAPTERS.length} ({pct}%)
            </span>
          </div>
          <div>
            <span style={{ color: "#4ade80", fontWeight: 700 }}>Commands</span>
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
                color: "#4ade80",
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
    <SandboxScreen mob={mob} />
  ) : lessonActive ? (
    <div
      style={{
        flex: 1,
        minHeight: mob ? "50vh" : undefined,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
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
          fontSize: FS,
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
            {e.t === "in" && (
              <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
                <span
                  style={{
                    color: "#4ade80",
                    whiteSpace: "pre",
                    fontWeight: 600,
                    marginRight: 4,
                  }}
                >
                  {mob ? "$" : `ubuntu@server:${(e.dir === "/home/ubuntu" ? "~" : e.dir?.startsWith("/home/ubuntu/") ? "~" + e.dir.slice(12) : e.dir || "~")}$`}{" "}
                </span>
                <span style={{ color: e.v ? "#e8e8e8" : "transparent" }}>
                  {e.v || "."}
                </span>
              </div>
            )}
            {e.t === "out" && (
              <pre
                style={{
                  margin: "2px 0 4px",
                  padding: 0,
                  background: "transparent",
                  fontSize: FS,
                  lineHeight: 1.6,
                  color: "#b0b0b0",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  textAlign: "left",
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
                  background: "#0d1a0d",
                  borderRadius: "0 4px 4px 0",
                  color: "#8cd98c",
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
                style={{ color: "#4ade80", padding: "8px 0", fontWeight: 700 }}
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
                  fontSize: FS,
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
                <span style={{ color: "#f97316", fontSize: FS, fontFamily: mono, animation: "tgPulse 1.5s ease-in-out infinite" }}>
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
                <span style={{ color: "#4ade80", fontWeight: 700, marginRight: 8, fontSize: mob ? 16 : FS }}>
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
                    fontSize: mob ? 16 : FS,
                    fontFamily: mono,
                    padding: mob ? "8px 0" : "4px 0",
                    caretColor: "#4ade80",
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Done prompt */}
        {lessonDone && <Prompt dir={cwdDisplay} />}
      </div>
    </div>
  ) : (
    /* ── Menu right pane: chapter list ── */
    <div
      style={{
        flex: mob ? "none" : 1,
        overflow: mob ? "visible" : "auto",
        padding: mob ? "12px 12px" : "20px 24px",
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
                  fontSize: 11,
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
              return (
                <button
                  key={id}
                  onClick={() => startCh(ci)}
                  onMouseEnter={() => setNavIdx(mi)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: active ? "#1a1a26" : "transparent",
                    border: active
                      ? "1px solid #363644"
                      : "1px solid transparent",
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
                      fontSize: 11,
                      color: d ? "#4ade80" : active ? "#4ade80" : "#666",
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
                      fontSize: 13,
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
                        fontSize: 13,
                        fontWeight: 600,
                        color: active ? g.color : "#ddd",
                      }}
                    >
                      {c.title}
                    </span>

                    {!mob && (
                      <span
                        style={{ fontSize: 11, color: "#777", marginLeft: 8 }}
                      >
                        {c.desc}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 10, color: "#666", flexShrink: 0 }}>
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
            <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid #222230" }}>
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
                <span style={{ fontSize: 15, flexShrink: 0 }}>⟩_</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#38bdf8" }}>
                    Free Practice
                  </div>
                  <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>
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
        background: mob
          ? bg
          : "radial-gradient(rgb(0 252 255) 50%, rgb(141 255 185) 100%)",
      }}
    >
      {showInfo && <InfoModal mob={mob} onClose={() => setShowInfo(false)} onReset={() => { resetAllProgress(); setDone(new Set()); shownSections.current = new Set(); localStorage.removeItem("tol_sections_done"); localStorage.removeItem("tol_cert_shown"); }} />}
      {showShare && (
        <ShareCard mob={mob} done={done} onClose={() => setShowShare(false)} />
      )}

      {sectionModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setSectionModal(null)}>
          <div style={{ background: "#1a1a26", border: `1.5px solid ${sectionModal.color}40`, borderRadius: 12, padding: mob ? 28 : 40, maxWidth: 440, width: "100%", fontFamily: mono, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
            <h2 style={{ color: "#f0f0f0", fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>
              <span style={{ color: sectionModal.color }}>{sectionModal.label}</span> Complete
            </h2>
            <p style={{ color: "#999", fontSize: 12, margin: "0 0 20px", lineHeight: 1.6 }}>
              You finished all {sectionModal.ids.length} chapters in this section.
            </p>
            <p style={{ color: "#ccc", fontSize: 13, lineHeight: 1.7, margin: "0 0 24px", textAlign: "left" }}>
              {sectionModal.summary}
            </p>
            <button
              onClick={() => setSectionModal(null)}
              style={{ background: `${sectionModal.color}15`, border: `1.5px solid ${sectionModal.color}40`, color: sectionModal.color, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: "10px 28px", borderRadius: 8, fontFamily: mono }}
            >
              Continue
            </button>
          </div>
        </div>
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
          border: mob ? "none" : "1px solid #2a2a3a",
          boxShadow: mob
            ? "none"
            : "0 20px 60px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)",
          background: "#191922",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 14px",
            background: "linear-gradient(180deg, #2e2e3a 0%, #26262e 100%)",
            borderBottom: "1px solid #222230",
            borderRadius: mob ? 0 : "12px 12px 0 0",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a44" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a44" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a44" }} />
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
            terminally<span style={{ color: "#4ade80" }}>online</span>
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
            background: "#191922",
          }}
        >
          {leftPane}
          {rightPane}
        </div>
      </div>
    </div>
  );
}

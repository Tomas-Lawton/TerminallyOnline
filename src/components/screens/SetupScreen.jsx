import { DEVICES } from "@/data/devices";

const mono =
  "'SF Mono','Fira Code','JetBrains Mono','Menlo','Consolas',monospace";
const bg = "#191922";

const SETUP = {
  mac: {
    ready: true,
    steps: [
      "Open Terminal (search 'Terminal' in Spotlight) or install iTerm2",
      "macOS uses zsh by default — it's compatible with bash so theres no need to switch",
      'Install Homebrew for extra tools: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
      "Then install useful tools like: brew install tree",
    ],
  },
  linux: {
    ready: true,
    steps: [
      "Open your terminal emulator (Ctrl+Alt+T on most distros)",
      "Bash is the default shell on most Linux distributions",
      "Install tools with your package manager: sudo apt install tree htop tmux (Debian/Ubuntu) or sudo dnf install tree htop tmux (Fedora)",
    ],
  },
  windows: {
    ready: false,
    steps: [
      "Open PowerShell as Administrator",
      "Run: wsl --install",
      "Restart your computer when prompted",
      "Open 'Ubuntu' from the Start menu — this is your Linux terminal",
      "Set a username and password when prompted",
      "You now have a full Linux environment. All commands in this tutorial will work here.",
    ],
  },
};

const concepts = [
  {
    term: "Terminal",
    desc: "The application that provides a text-based interface to your computer. You type commands, press Enter, and see the output. Like a chat window where you talk directly to your operating system.",
  },
  {
    term: "Shell",
    desc: "The interpreter running inside the terminal that reads your commands and executes them. Bash is the default on most Linux servers, zsh on macOS.",
  },
  {
    term: "Command",
    desc: "A program you run by typing its name. Commands follow the pattern: command [flags] [arguments].",
  },
  {
    term: "Filesystem",
    desc: "The tree of folders (called directories) and files on your computer.",
  },
  {
    term: "Flags",
    desc: "Options that modify how a command behaves. They have a short form, like -l or a long form like --help.",
  },
  {
    term: "Path",
    desc: "A path is the address of a file or directory, and can be absolute: /home/ubuntu/file.txt (starts from root) or relative ./file.txt (starts from current location).",
  },
];

export default function SetupScreen({ mob, device, setScreen }) {
  const setup = SETUP[device] || SETUP.mac;
  const dev = DEVICES[device] || DEVICES.mac;

  return (
    <div
      data-setup-scroll
      style={{
        height: "100dvh",
        background: bg,
        color: "#c8c8c8",
        fontFamily: mono,
        overflow: "auto",
        boxSizing: "border-box",
        padding: "12px"
      }}
    >
      <div
        style={{
          maxWidth: 640,
          width: mob ? "100%" : "75%",
          textAlign: "left",
          margin: "0 auto",
          padding: mob ? "0" : "48px 20px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: "#777", marginBottom: 6 }}>
            {dev.icon} {dev.label}
          </div>
          <h1
            style={{
              color: "#f0f0f0",
              fontSize: mob ? 22 : 28,
              fontWeight: 800,
              margin: "0 0 8px",
              lineHeight: 1.2,
              letterSpacing: "-0.5px",
            }}
          >
            Before you start
          </h1>
          <p
            style={{
              color: "#ccccccff",
              fontSize: 13,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            A quick intro to what you're about to learn
          </p>
        </div>

        {/* Key concepts */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#4ade80",
              letterSpacing: "0.06em",
              marginBottom: 10,
            }}
          >
            KEY CONCEPTS
          </div>
          <div
            style={{
              padding: mob ? "4px 10px" : "4px 14px",
              background: "#1a1a26",
              border: "1px solid #282836",
              borderRadius: 6,
            }}
          >
            {concepts.map((c, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 0",
                  borderBottom:
                    i < concepts.length - 1 ? "1px solid #222230" : "none",
                }}
              >
                <span
                  style={{ color: "#f0f0f0", fontWeight: 700, fontSize: 13 }}
                >
                  {c.term}
                </span>
                <span style={{ color: "#666", margin: "0 8px" }}>—</span>
                <span style={{ color: "#fff", fontSize: 12, lineHeight: 1.5, overflowWrap: "break-word" }}>
                  {c.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Setup steps */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#f9c74f",
              letterSpacing: "0.06em",
              marginBottom: 10,
            }}
          >
            {setup.ready
              ? `SETUP — ${dev.label.toUpperCase()} (READY TO GO)`
              : `SETUP — ${dev.label.toUpperCase()} (NEEDS WSL)`}
          </div>
          <div
            style={{
              padding: mob ? "8px 10px" : "12px 16px",
              background: "#1a1a26",
              border: "1px solid #282836",
              borderRadius: 6,
            }}
          >
            {setup.steps.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "6px 0",
                  borderBottom:
                    i < setup.steps.length - 1 ? "1px solid #222230" : "none",
                }}
              >
                <span
                  style={{
                    color: "#666",
                    fontSize: 11,
                    fontWeight: 700,
                    width: 18,
                    textAlign: "right",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {i + 1}.
                </span>
                <span
                  style={{ color: "#f0f0f0", fontSize: 12, lineHeight: 1.55, overflowWrap: "break-word", wordBreak: "break-word" }}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>
          {!setup.ready && (
            <p style={{ fontSize: 11, color: "#f97316", marginTop: 8 }}>
              WSL gives you a full Linux environment inside Windows. All
              commands in this tutorial work in WSL.
            </p>
          )}
        </div>

        {/* Tip */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#4ade80",
            letterSpacing: "0.06em",
            marginBottom: 10,
          }}
        >
          Practice
        </div>
        <div
          style={{
            marginBottom: mob ? 24 : 32,
            padding: mob ? "10px 10px" : "12px 14px",
            background: "#0d1a0d",
            border: "1px solid #1a2e1a",
            borderRadius: 6,
            fontSize: 12,
            color: "#4ade80",
            lineHeight: 1.65,
          }}
        >
          This site teaches commands in a simulated terminal to help you learn
          syntax and build muscle memory, but it isn’t a substitute for a real
          shell. Open your terminal alongside the lessons and run each command
          there to see real outputs.
        </div>

        {/* Continue */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={() => setScreen("menu")}
            style={{
              background: "#0f1f0f",
              border: "1.5px solid #1f3a1f",
              color: "#4ade80",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              padding: "12px 32px",
              borderRadius: 8,
              fontFamily: mono,
              minHeight: 44,
            }}
          >
            Start
          </button>
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => setScreen("landing")}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: mono,
                padding: 4,
              }}
            >
              ← Back <span style={{ color: "#555" }}>Esc</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

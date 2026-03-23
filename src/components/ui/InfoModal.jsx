import { useState } from "react";

const mono = "'SF Mono','Fira Code','JetBrains Mono','Menlo','Consolas',monospace";
const bg = "#191922";

export default function InfoModal({ mob, onClose, onReset }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [fbEmail, setFbEmail] = useState("");
  const [fbMsg, setFbMsg] = useState("");
  const [fbStatus, setFbStatus] = useState(null); // "sent" | "error"

  const handleFeedback = (e) => {
    e.preventDefault();
    if (!fbMsg.trim()) return;
    const body = new URLSearchParams();
    body.append("form-name", "feedback");
    body.append("email", fbEmail);
    body.append("message", fbMsg);
    fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() })
      .then(() => { setFbStatus("sent"); setFbEmail(""); setFbMsg(""); })
      .catch(() => setFbStatus("error"));
  };

  const inputStyle = {
    background: "#191922",
    border: "1px solid #33333e",
    borderRadius: 5,
    color: "#f0f0f0",
    padding: "8px 10px",
    fontFamily: mono,
    fontSize: mob ? 16 : 13,
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    WebkitAppearance: "none",
    appearance: "none",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: bg, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "#1a1a26", border: "1px solid #33333e", borderRadius: 12, padding: mob ? 24 : 36, maxWidth: 500, width: "100%", fontFamily: mono, color: "#aaa", fontSize: 13, lineHeight: 1.7, maxHeight: "90dvh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <h2 style={{ color: "#f0f0f0", fontSize: 18, margin: "0 0 6px", fontWeight: 700 }}>terminally<span style={{ color: "#4ade80" }}>online</span><span style={{ color: "#666" }}>.sh</span></h2>
        <p style={{ color: "#777", margin: "0 0 20px", fontSize: 12 }}>Learn the command line interactively</p>

        <p><span style={{ color: "#f0f0f0" }}>What is this?</span> An interactive tutorial teaching the command line: bash (the shell), Unix commands, and tools like Docker, SSH, nginx. Type real commands, build muscle memory.</p>

        <p style={{ marginTop: 16 }}><span style={{ color: "#f0f0f0" }}>How to use:</span> Pick a chapter. Read the teaching notes. Type the command for each step. Press Tab if you need a hint. Arrow keys recall previous commands. Type 'clear' to empty the terminal.</p>

        <p style={{ marginTop: 16 }}><span style={{ color: "#f0f0f0" }}>Practice tip:</span> Don't just complete each step once. Come back and try from memory. Real learning happens when your fingers know the command before your brain finishes the thought.</p>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #2a2a36", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="https://buymeacoffee.com/tomaslawton" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "#1a2e1a", border: "1px solid #2d4a2d", color: "#4ade80", padding: "8px 16px", borderRadius: 6, fontSize: 13, textDecoration: "none", fontWeight: 600, fontFamily: mono }}>Buy me a coffee</a>
          <button
            onClick={() => { setShowFeedback(f => !f); setFbStatus(null); }}
            style={{ background: "none", border: "1px solid #33333e", color: "#aaa", padding: "8px 16px", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: mono, fontWeight: 600 }}
          >
            Give feedback
          </button>
        </div>

        {showFeedback && (
          <div style={{ marginTop: 16 }}>
            {fbStatus === "sent" ? (
              <p style={{ color: "#4ade80", fontSize: 12, margin: 0 }}>Thanks for your feedback!</p>
            ) : (
              <form onSubmit={handleFeedback} className="tg-feedback" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={fbEmail}
                  onChange={e => setFbEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
                <textarea
                  placeholder="What would you improve? Found a bug? Have an idea?"
                  value={fbMsg}
                  onChange={e => setFbMsg(e.target.value)}
                  rows={3}
                  required
                  style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
                />
                {fbStatus === "error" && <p style={{ color: "#ef4444", fontSize: 11, margin: 0 }}>Something went wrong. Try again.</p>}
                <button
                  type="submit"
                  style={{ background: "#1a2e1a", border: "1px solid #2d4a2d", color: "#4ade80", padding: "6px 14px", borderRadius: 5, cursor: "pointer", fontFamily: mono, fontSize: 12, fontWeight: 600, alignSelf: "flex-start" }}
                >
                  Send
                </button>
              </form>
            )}
          </div>
        )}

        <div style={{ marginTop: 20, fontSize: 11, color: "#777" }}>
          Inspired by <a href="https://openvim.com" target="_blank" rel="noopener noreferrer" style={{ color: "#ccccccff" }}>OpenVim</a> & <a href="https://www.vimgym.dev" target="_blank" rel="noopener noreferrer" style={{ color: "#ccccccff" }}>VimGym</a>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #2a2a36", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button onClick={onClose} style={{ background: "none", border: "1px solid #33333e", color: "#fff", padding: "6px 16px", borderRadius: 5, cursor: "pointer", fontFamily: mono, fontSize: 12 }}>Close <span style={{ color: "#666" }}>Esc</span></button>

          {onReset && (
            !confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                style={{ background: "none", border: "1px solid #3a2020", color: "#ef4444", padding: "6px 16px", borderRadius: 5, cursor: "pointer", fontFamily: mono, fontSize: 12 }}
              >
                Reset progress
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "#ef4444" }}>Are you sure?</span>
                <button
                  onClick={() => { onReset(); setConfirmReset(false); onClose(); }}
                  style={{ background: "#2a1010", border: "1px solid #ef4444", color: "#ef4444", padding: "4px 12px", borderRadius: 4, cursor: "pointer", fontFamily: mono, fontSize: 11, fontWeight: 700 }}
                >
                  Yes, reset
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  style={{ background: "none", border: "1px solid #33333e", color: "#888", padding: "4px 12px", borderRadius: 4, cursor: "pointer", fontFamily: mono, fontSize: 11 }}
                >
                  Cancel
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

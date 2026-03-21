import { useState } from "react";

const mono = "'SF Mono','Fira Code','JetBrains Mono','Menlo','Consolas',monospace";
const bg = "#191922";

export default function InfoModal({ mob, onClose, onReset }) {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div style={{ position: "fixed", inset: 0, background: bg, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "#1a1a26", border: "1px solid #33333e", borderRadius: 12, padding: mob ? 24 : 36, maxWidth: 500, width: "100%", fontFamily: mono, color: "#aaa", fontSize: 13, lineHeight: 1.7 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ color: "#f0f0f0", fontSize: 18, margin: "0 0 6px", fontWeight: 700 }}>terminally<span style={{ color: "#4ade80" }}>online</span><span style={{ color: "#666" }}>.sh</span></h2>
        <p style={{ color: "#777", margin: "0 0 20px", fontSize: 12 }}>Learn the command line interactively</p>

        <p><span style={{ color: "#f0f0f0" }}>What is this?</span> An interactive tutorial teaching the command line: bash (the shell), Unix commands, and tools like Docker, SSH, nginx. Type real commands, build muscle memory.</p>

        <p style={{ marginTop: 16 }}><span style={{ color: "#f0f0f0" }}>How to use:</span> Pick a chapter. Read the teaching notes. Type the command for each step. Press Tab if you need a hint. Arrow keys recall previous commands. Type 'clear' to empty the terminal.</p>

        <p style={{ marginTop: 16 }}><span style={{ color: "#f0f0f0" }}>Practice tip:</span> Don't just complete each step once. Come back and try from memory. Real learning happens when your fingers know the command before your brain finishes the thought.</p>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #2a2a36" }}>
          <a href="https://buymeacoffee.com/tomaslawton" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "#1a2e1a", border: "1px solid #2d4a2d", color: "#4ade80", padding: "8px 16px", borderRadius: 6, fontSize: 13, textDecoration: "none", fontWeight: 600, fontFamily: mono }}>☕ Buy me a coffee</a>
        </div>

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

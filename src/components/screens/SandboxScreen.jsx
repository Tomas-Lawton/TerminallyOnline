import { useState, useRef, useEffect, useCallback } from "react";
import { FS } from "@/data/filesystem";
import { executeCommand } from "@/utils/commands";

const mono = "'SF Mono','Fira Code','JetBrains Mono','Menlo','Consolas',monospace";
const FS_SIZE = 13;

export default function SandboxScreen({ mob }) {
  const [sbHist, setSbHist] = useState([]);
  const [sbInput, setSbInput] = useState("");
  const [sbCwd, setSbCwd] = useState("/home/ubuntu");
  const [sbCmdH, setSbCmdH] = useState([]);
  const [sbCmdI, setSbCmdI] = useState(-1);
  const sbRef = useRef(null);
  const sbScroll = useRef(null);

  useEffect(() => { if (sbRef.current) sbRef.current.focus(); }, [sbHist]);
  useEffect(() => { if (sbScroll.current) sbScroll.current.scrollTop = sbScroll.current.scrollHeight; }, [sbHist]);

  const sbExec = useCallback((raw) => {
    return executeCommand(raw, sbCwd, FS, sbCmdH);
  }, [sbCwd, sbCmdH]);

  const sbGo = useCallback(() => {
    const v = sbInput.trim();
    if (!v) return;
    setSbCmdH(h => [v, ...h]);
    setSbCmdI(-1);
    const result = sbExec(v);
    if (result.output === null) { setSbHist([]); setSbInput(""); return; }
    if (result.newCwd !== sbCwd) setSbCwd(result.newCwd);
    setSbHist(h => [...h, { prompt: `ubuntu@server:${sbCwd.replace("/home/ubuntu", "~")}$`, cmd: v }, ...(result.output ? [{ output: result.output }] : [])]);
    setSbInput("");
  }, [sbInput, sbExec, sbCwd]);

  const sbKd = (e) => {
    if (e.key === "Enter") { e.preventDefault(); sbGo(); }
    if (e.key === "ArrowUp") { e.preventDefault(); if (sbCmdH.length) { const n = Math.min(sbCmdI + 1, sbCmdH.length - 1); setSbCmdI(n); setSbInput(sbCmdH[n]); } }
    if (e.key === "ArrowDown") { e.preventDefault(); if (sbCmdI > 0) { setSbCmdI(sbCmdI - 1); setSbInput(sbCmdH[sbCmdI - 1]); } else { setSbCmdI(-1); setSbInput(""); } }
    if (e.key === "Tab") { e.preventDefault(); }
  };

  const sbPrompt = mob ? "$" : `ubuntu@server:${sbCwd.replace("/home/ubuntu", "~")}$`;

  return (
    <div
      style={{ flex: 1, minHeight: mob ? "50vh" : undefined, overflow: "hidden", display: "flex", flexDirection: "column" }}
      onClick={() => sbRef.current?.focus()}
    >
      <div ref={sbScroll} style={{
        flex: 1, overflow: "auto",
        padding: mob ? "14px 16px" : "20px 24px",
        fontSize: FS_SIZE,
        lineHeight: 1.6,
      }}>
        {sbHist.map((e, i) => (
          <div key={i} style={{ marginBottom: 2 }}>
            {e.prompt && <div style={{ display: "flex", gap: 8 }}><span style={{ color: "#4ade80", fontWeight: 700, whiteSpace: "pre" }}>{e.prompt} </span><span style={{ color: "#f0f0f0" }}>{e.cmd}</span></div>}
            {e.output && <pre style={{ margin: "4px 0 8px", padding: 0, background: "transparent", fontSize: FS_SIZE, lineHeight: 1.6, color: "#b0b0b0", whiteSpace: "pre-wrap", wordBreak: "break-word", textAlign: "left" }}>{e.output}</pre>}
          </div>
        ))}
        <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
          <span style={{ color: "#4ade80", fontWeight: 700, whiteSpace: "pre", marginRight: 8, fontSize: mob ? 16 : FS_SIZE }}>{sbPrompt} </span>
          <input ref={sbRef} type="text" value={sbInput} onChange={e => setSbInput(e.target.value)} onKeyDown={sbKd} onClick={e => e.stopPropagation()} autoCapitalize="none" autoCorrect="off" autoComplete="off" spellCheck={false}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#f0f0f0", fontSize: mob ? 16 : FS_SIZE, fontFamily: mono, padding: mob ? "8px 0" : "4px 0", caretColor: "#4ade80" }} />
        </div>
      </div>
    </div>
  );
}

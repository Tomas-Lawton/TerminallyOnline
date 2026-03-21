const mono = "'SF Mono','Fira Code','JetBrains Mono','Menlo','Consolas',monospace";

export default function TopBar({ mob, onBack, rightContent, children }) {
  return (
    <div style={{ padding: mob ? "8px 12px" : "8px 20px", borderBottom: "1px solid #222230", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "#161620" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "1px solid #33333e", color: "#ccccccff", fontSize: 11, cursor: "pointer", padding: mob ? "6px 10px" : "4px 10px", borderRadius: 5, fontFamily: mono, minHeight: 32 }}>← chapters <span style={{ color: "#666" }}>Esc</span></button>
        {children}
      </div>
      {rightContent}
    </div>
  );
}

const mono = "'SF Mono','Fira Code','JetBrains Mono','Menlo','Consolas',monospace";

export default function OnboardingModal({ mob, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 150,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1a1a26",
          border: "1px solid #33333e",
          borderRadius: 12,
          padding: mob ? 24 : 36,
          maxWidth: 560,
          width: "100%",
          fontFamily: mono,
          color: "#aaa",
          fontSize: 13,
          lineHeight: 1.7,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            color: "#f0f0f0",
            fontSize: mob ? 18 : 20,
            fontWeight: 800,
          }}
        >
          How it works
        </h2>

        {/* Placeholder for GIF/video — replace src with actual asset */}
        <div
          style={{
            background: "#191922",
            borderRadius: 8,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#555",
            fontSize: 12,
            margin: mob ? "12px 0px" : "24px 0px"
          }}
        >
          <img src="/demo.gif" alt="Demo" style={{ width: "100%", display: "block" }} /> 
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: "#4ade80", fontWeight: 700, flexShrink: 0 }}>1.</span>
            <span><span style={{ color: "#f0f0f0" }}>Pick a chapter</span> — start from the top or jump to any topic</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: "#4ade80", fontWeight: 700, flexShrink: 0 }}>2.</span>
            <span><span style={{ color: "#f0f0f0" }}>Type the command</span> — read the explanation, then type what it asks</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: "#4ade80", fontWeight: 700, flexShrink: 0 }}>3.</span>
            <span><span style={{ color: "#f0f0f0" }}>Press Tab for a hint</span> — if you're stuck, Tab shows the answer</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: "#4ade80", fontWeight: 700, flexShrink: 0 }}>4.</span>
            <span><span style={{ color: "#f0f0f0" }}>Try it for real</span> — open a terminal on your machine and run each command there too</span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: "#0f1f0f",
            border: "1.5px solid #1f3a1f",
            color: "#4ade80",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            padding: "10px 28px",
            borderRadius: 8,
            fontFamily: mono,
            width: "100%",
          }}
        >
          Get started
        </button>
      </div>
    </div>
  );
}

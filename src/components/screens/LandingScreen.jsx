import { DEVICES } from "@/data/devices";
import { resetAllProgress } from "@/utils/progress";
import InfoModal from "../ui/InfoModal";

const mono =
  "'SF Mono','Fira Code','JetBrains Mono','Menlo','Consolas',monospace";
const bg = "#191922";

export default function LandingScreen({
  mob,
  navIdx,
  setNavIdx,
  setDevice,
  setScreen,
  showInfo,
  setShowInfo,
  setDone,
}) {
  return (
    <div
      style={{
        height: "100dvh",
        background: bg,
        color: "#c8c8c8",
        fontFamily: mono,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {showInfo && <InfoModal mob={mob} onClose={() => setShowInfo(false)} onReset={() => { resetAllProgress(); setDone(new Set()); }} />}
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <div style={{ marginBottom: 48 }}>
          <p
            style={{
              fontSize: 15,
              color: "#777",
              margin: "0 0 6px",
              fontWeight: 400,
              letterSpacing: "0.02em",
            }}
          >
            you are...
          </p>
          {/* <h1
            style={{
              color: "#4ade80",
              fontSize: mob ? 28 : 40,
              fontWeight: 800,
              margin: "0 0 12px",
              lineHeight: 1.15,
              letterSpacing: "-1px",
            }}
          >
            terminallyonline<span style={{ color: "#666" }}>.sh</span>
          </h1> */}
          <h1
            style={{
              color: "#f0f0f0",
              fontSize: mob ? 28 : 40,
              fontWeight: 800,
              margin: "0 0 12px",
              lineHeight: 1.15,
              letterSpacing: "-1px",
            }}
          >
            terminally<span style={{ color: "#4ade80" }}>online</span>
            <span style={{ color: "#666" }}>.sh</span>
          </h1>

          <p
            style={{ color: "#ccccccff", fontSize: 14, margin: 0, lineHeight: 1.6 }}
          >
            Shell. Unix commands. DevOps tools.
            <br />
            Type real commands. Build muscle memory.
          </p>
        </div>

        <p style={{ color: "#ccccccff", fontSize: 13, marginBottom: 16 }}>
          Select your machine
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Object.entries(DEVICES).map(([k, d], i) => {
            const active = navIdx === i;
            return (
              <button
                key={k}
                onClick={() => {
                  setDevice(k);
                  setScreen("setup");
                }}
                onMouseEnter={() => setNavIdx(i)}
                style={{
                  background: active ? "#1e1e2a" : "#1a1a26",
                  border: `1.5px solid ${active ? "#4ade80" : "#33333e"}`,
                  borderRadius: 10,
                  padding: mob ? "16px 16px" : "16px 20px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                  fontFamily: mono,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  color: "#f0f0f0",
                  outline: "none",
                  minHeight: 44,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    width: 22,
                    height: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 4,
                    background: active ? "#1a2e1a" : "#1e1e28",
                    color: active ? "#4ade80" : "#fff",
                    border: `1px solid ${active ? "#2d4a2d" : "#33333e"}`,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontSize: 22,
                    width: 30,
                    textAlign: "center",
                    color: active ? "#4ade80" : "#777",
                  }}
                >
                  {d.icon}
                </span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{d.label}</div>
                  <div style={{ fontSize: 12, color: "#ccccccff", marginTop: 3 }}>
                    {d.note}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowInfo(true)}
          style={{
            marginTop: 32,
            background: "none",
            border: "none",
            color: "#777",
            fontSize: 12,
            cursor: "pointer",
            fontFamily: mono,
            padding: 8,
          }}
        >
          About this project <span style={{ color: "#666" }}>(?)</span>
        </button>
      </div>
    </div>
  );
}

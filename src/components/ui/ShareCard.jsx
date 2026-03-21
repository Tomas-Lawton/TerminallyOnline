import { useRef, useCallback, useState } from "react";
import { CHAPTERS } from "@/data/chapters";
import { getTotalCommands, getStreak } from "@/utils/progress";

const mono = "'SF Mono','Fira Code','JetBrains Mono','Menlo','Consolas',monospace";

const TERM_W = 540;
const TERM_H = 380;
const PAD = 48;
const CARD_W = TERM_W + PAD * 2;
const CARD_H = TERM_H + PAD * 2;
const DPR = 3; // fixed high-res for download quality

function drawCard(canvas, stats) {
  const ctx = canvas.getContext("2d");
  canvas.width = CARD_W * DPR;
  canvas.height = CARD_H * DPR;
  canvas.style.width = CARD_W + "px";
  canvas.style.height = CARD_H + "px";
  ctx.scale(DPR, DPR);

  // Outer background (the padding area)
  ctx.fillStyle = "#0c0c12";
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Terminal window background
  ctx.save();
  ctx.translate(PAD, PAD);

  ctx.fillStyle = "#191922";
  ctx.beginPath();
  ctx.roundRect(0, 0, TERM_W, TERM_H, 12);
  ctx.fill();

  // Border
  ctx.strokeStyle = "#2a2a3a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(0, 0, TERM_W, TERM_H, 12);
  ctx.stroke();

  // Title bar
  const titleH = 38;
  ctx.fillStyle = "#26262e";
  ctx.beginPath();
  ctx.roundRect(0, 0, TERM_W, titleH, [12, 12, 0, 0]);
  ctx.fill();
  ctx.fillStyle = "#222230";
  ctx.fillRect(0, titleH - 1, TERM_W, 1);

  // Traffic lights
  const dots = [["#ff5f57", 18], ["#febc2e", 34], ["#28c840", 50]];
  dots.forEach(([c, x]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, titleH / 2, 5, 0, Math.PI * 2); ctx.fill(); });

  // Title text
  ctx.fillStyle = "#fff";
  ctx.font = `500 11px ${mono}`;
  ctx.textAlign = "center";
  ctx.fillText("terminallyonline.sh — achievement", TERM_W / 2, titleH / 2 + 4);

  // Terminal body
  const px = 28;
  let y = titleH + 32;
  ctx.textAlign = "left";

  // Prompt line
  ctx.fillStyle = "#4ade80";
  ctx.font = `700 13px ${mono}`;
  ctx.fillText("$", px, y);
  ctx.fillStyle = "#e8e8e8";
  ctx.font = `400 13px ${mono}`;
  ctx.fillText(" terminallyonline --achievement", px + 14, y);

  y += 32;

  // Achievement box
  const boxX = px;
  const boxW = TERM_W - px * 2;
  const boxH = 220;
  ctx.strokeStyle = "#4ade8040";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(boxX, y, boxW, boxH, 8);
  ctx.stroke();
  ctx.fillStyle = "#0f1a1408";
  ctx.beginPath();
  ctx.roundRect(boxX, y, boxW, boxH, 8);
  ctx.fill();

  const ix = boxX + 20;
  y += 28;

  // Title
  ctx.fillStyle = "#4ade80";
  ctx.font = `700 16px ${mono}`;
  ctx.fillText("ALL CHAPTERS COMPLETE", ix, y);
  y += 8;

  // Divider
  ctx.fillStyle = "#4ade8030";
  ctx.fillRect(ix, y, boxW - 40, 1);
  y += 20;

  // Stats
  const lines = [
    ["Chapters", `${stats.chapters}/${stats.total}`],
    ["Commands", `${stats.commands} typed`],
    ["Streak", `${stats.streak} day${stats.streak !== 1 ? "s" : ""}`],
  ];
  ctx.font = `400 12px ${mono}`;
  lines.forEach(([label, value]) => {
    ctx.fillStyle = "#4ade80";
    ctx.font = `700 12px ${mono}`;
    ctx.fillText(label, ix, y);
    ctx.fillStyle = "#fff";
    ctx.font = `400 12px ${mono}`;
    ctx.fillText(": ", ix + ctx.measureText(label).width, y);
    ctx.fillStyle = "#e0e0e0";
    ctx.fillText(value, ix + ctx.measureText(label).width + ctx.measureText(": ").width, y);
    y += 22;
  });

  // Footer
  ctx.fillStyle = "#555";
  ctx.font = `400 11px ${mono}`;
  ctx.textAlign = "center";
  ctx.fillText("terminallyonline.sh", TERM_W / 2, TERM_H - 16);

  ctx.restore();
}

export default function ShareCard({ done, onClose, mob }) {
  const canvasRef = useRef(null);
  const [downloaded, setDownloaded] = useState(false);

  const totalCommands = getTotalCommands();
  const streak = getStreak();
  const allComplete = done.size >= CHAPTERS.length;
  const allBadges = CHAPTERS.filter((_, i) => done.has(i)).map(c => c.badge).filter(Boolean);

  const stats = {
    chapters: done.size,
    total: CHAPTERS.length,
    commands: totalCommands,
    streak,
    badges: allBadges,
  };

  const canvasCallback = useCallback((node) => {
    canvasRef.current = node;
    if (node) drawCard(node, stats);
  }, [stats.chapters, stats.commands, stats.streak]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "terminallyonline-achievement.png";
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleShareX = () => {
    const text = encodeURIComponent(
      `I just completed all ${CHAPTERS.length} chapters on terminallyonline.sh — an interactive terminal tutorial.\n\n${totalCommands} commands typed. ${allBadges.length} badges earned.\n\nterminallyonline.sh`
    );
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank", "noopener");
  };

  const btnStyle = (bg, border, color) => ({
    background: bg, border: `1.5px solid ${border}`, color,
    fontSize: 12, cursor: "pointer", padding: "8px 14px", borderRadius: 6,
    fontFamily: mono, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
    minHeight: 36,
  });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: mob ? 8 : 16,
    }} onClick={onClose}>
      <div style={{
        background: "#1a1a26", border: "1px solid #33333e", borderRadius: mob ? 8 : 12,
        padding: mob ? 14 : 28, maxWidth: 680, width: "100%", fontFamily: mono,
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: allComplete ? "#4ade80" : "#f0f0f0" }}>
              {allComplete ? "All Chapters Complete!" : "Your Progress"}
            </div>
            <div style={{ fontSize: 11, color: "#777" }}>
              {allComplete ? "Share your achievement" : `${done.size}/${CHAPTERS.length} chapters completed`}
            </div>
          </div>
        </div>

        {/* Canvas card */}
        <div style={{
          borderRadius: 8, overflow: "hidden", marginBottom: 16,
          display: "flex", justifyContent: "center",
          background: "#0c0c12",
        }}>
          <canvas
            ref={canvasCallback}
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={handleDownload} style={btnStyle("#14141e", "#33333e", "#e0e0e0")}>
            {downloaded ? "✓ Saved" : "↓ Download"}
          </button>
          <button onClick={handleShareX} style={btnStyle("#0f1a14", "#1f3a1f", "#4ade80")}>
            Share on X →
          </button>
        </div>

        {/* Close */}
        <button onClick={onClose} style={{
          marginTop: 16, background: "none", border: "1px solid #33333e",
          color: "#666", padding: "5px 14px", borderRadius: 5, cursor: "pointer",
          fontFamily: mono, fontSize: 11,
        }}>Close <span style={{ color: "#555" }}>Esc</span></button>
      </div>
    </div>
  );
}

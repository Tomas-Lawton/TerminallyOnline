import { createElement } from "react";

export const norm = s => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Parse backtick-wrapped text into React elements with code styling */
export function renderCode(text) {
  const parts = text.split(/(`[^`]+`)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      const code = part.slice(1, -1);
      return createElement("span", { key: i, style: { background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: 3, padding: "1px 5px", fontSize: "0.92em", color: "#4ade80", fontFamily: "'SF Mono','Fira Code','JetBrains Mono','Menlo','Consolas',monospace" } }, code);
    }
    return part;
  });
}

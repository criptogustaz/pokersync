import React from "react";
import { C } from "../theme.js";

export default function ActionBar({ sizing, onSizing, onAction, callAmount = 2.0 }) {
  const btn = {
    border: 0,
    borderRadius: 10,
    padding: "12px 20px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
      <button style={{ ...btn, background: "transparent", border: `1px solid ${C.neg}`, color: C.neg }} onClick={() => onAction("FOLD", 0)}>
        Fold
      </button>
      <button style={{ ...btn, background: C.panel2, color: C.text, border: `1px solid ${C.line}` }} onClick={() => onAction("CALL", callAmount)}>
        Call {callAmount.toFixed(1)}
      </button>
      <button style={{ ...btn, background: C.gold, color: "#141207" }} onClick={() => onAction("RAISE", sizing)}>
        Raise {sizing.toFixed(1)} bb
      </button>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 220 }}>
        <input
          type="range"
          min="2"
          max="6"
          step="0.1"
          value={sizing}
          onChange={(e) => onSizing(Number(e.target.value))}
          style={{ accentColor: C.gold }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.sub }}>
          <span>2.0</span>
          <span>Sizing (bb)</span>
          <span>6.0</span>
        </div>
      </div>
    </div>
  );
}

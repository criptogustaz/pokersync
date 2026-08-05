import React from "react";
import { C } from "../theme.js";

function presetSize(pot, mult, min, max) {
  const raw = pot * mult;
  const clamped = Math.min(max, Math.max(min, raw));
  return Math.round(clamped * 2) / 2;
}

export default function ActionBar({ pot = 0, sizingRange, onAction, callAmount = 2.0 }) {
  const { min = 2, max = 6 } = sizingRange || {};
  const btn = {
    border: 0,
    borderRadius: 10,
    padding: "12px 20px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  };

  const presets = [
    { label: "½ Pot", value: presetSize(pot, 0.5, min, max) },
    { label: "¾ Pot", value: presetSize(pot, 0.75, min, max) },
    { label: "Pot", value: presetSize(pot, 1, min, max) },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
      <button style={{ ...btn, background: "transparent", border: `1px solid ${C.neg}`, color: C.neg }} onClick={() => onAction("FOLD", 0)}>
        Fold
      </button>
      <button style={{ ...btn, background: C.panel2, color: C.text, border: `1px solid ${C.line}` }} onClick={() => onAction("CHECK", 0)}>
        Check
      </button>
      <button style={{ ...btn, background: C.panel2, color: C.text, border: `1px solid ${C.line}` }} onClick={() => onAction("CALL", callAmount)}>
        Call {callAmount.toFixed(1)}
      </button>
      {presets.map((p) => (
        <button
          key={p.label}
          style={{ ...btn, background: C.gold, color: C.accentText }}
          onClick={() => onAction("BET", p.value)}
        >
          {p.label} · {p.value.toFixed(1)}
        </button>
      ))}
    </div>
  );
}

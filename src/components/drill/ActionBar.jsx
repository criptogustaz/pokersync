import React from "react";
import { C } from "../theme.js";

// Converte o tamanho real da aposta (vindo do solver) numa etiqueta de fração
// de pote legível — só para exibição; o valor usado na ação é sempre o
// número exato que veio do banco de dados.
function fractionLabel(ratio) {
  const table = [
    [0.30, 0.36, "1/3 Pot"],
    [0.45, 0.55, "1/2 Pot"],
    [0.60, 0.70, "2/3 Pot"],
    [0.70, 0.80, "3/4 Pot"],
    [0.95, 1.05, "Pot"],
  ];
  for (const [lo, hi, label] of table) {
    if (ratio >= lo && ratio <= hi) return label;
  }
  return `${Math.round(ratio * 100)}% Pot`;
}

export default function ActionBar({ pot = 0, betSizings = [], onAction, callAmount = 2.0 }) {
  const base = {
    border: 0,
    borderRadius: 11,
    padding: "13px 0",
    fontSize: 15,
    fontWeight: 800,
    fontFamily: "'Rajdhani', sans-serif",
    letterSpacing: "0.06em",
    cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 460 }}>
      {/* Até 3 tamanhos de aposta — exatamente os que o solver trouxe para essa mão */}
      {betSizings.length > 0 && (
        <div style={{ display: "flex", gap: 8 }}>
          {betSizings.map((sz) => (
            <button
              key={sz}
              style={{ ...base, flex: 1, background: `${C.gold}18`, color: C.goldSoft, border: `1px solid ${C.gold}44` }}
              onClick={() => onAction("BET", sz)}
            >
              {fractionLabel(pot > 0 ? sz / pot : 0)}
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2, fontWeight: 700 }}>{sz.toFixed(1)} bb</div>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <button style={{ ...base, background: "transparent", border: `1.5px solid ${C.neg}`, color: C.neg }} onClick={() => onAction("FOLD", 0)}>
          Fold
        </button>
        <button style={{ ...base, background: C.panel2, color: C.text, border: `1px solid ${C.line}` }} onClick={() => onAction("CHECK", 0)}>
          Check
        </button>
        <button style={{ ...base, background: C.panel2, color: C.text, border: `1px solid ${C.line}` }} onClick={() => onAction("CALL", callAmount)}>
          Call
          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2, fontWeight: 700 }}>{callAmount.toFixed(1)} bb</div>
        </button>
      </div>
    </div>
  );
}

import React, { useState } from "react";

const STREETS = ["Pré-Flop", "Pós-Flop", "Ambos"];
const ACTIONS = [
  "Qualquer",
  "RFI",
  "vs Open",
  "vs 3-Bet",
  "vs 4-Bet",
  "vs 5-Bet",
  "vs Squeeze",
  "vs Limp",
  "Blind War",
];

function Chip({ label, active, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: "4px 10px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: '"Space Grotesk", sans-serif',
        cursor: "pointer",
        border: active
          ? "1px solid rgba(255,255,255,0.85)"
          : "1px solid rgba(255,255,255,0.06)",
        background: active ? "#FFFFFF" : h ? "rgba(255,255,255,0.05)" : "transparent",
        color: active ? "#111111" : h ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
        transition: "all .15s",
        whiteSpace: "nowrap",
        lineHeight: 1.4,
      }}
    >
      {label}
    </button>
  );
}

/**
 * Barra de filtro rápido de cenário — renderiza abaixo da mesa.
 * Dois grupos: Street e Action, tudo em uma linha compacta.
 */
export default function ScenarioBar({ filters, onSet }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "8px 16px",
        borderRadius: 12,
        background: "rgba(30,30,30,0.6)",
        border: "1px solid rgba(255,255,255,0.04)",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      {/* Street */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.2)",
            marginRight: 4,
          }}
        >
          Street
        </span>
        {STREETS.map((s) => (
          <Chip
            key={s}
            label={s}
            active={filters.street === s}
            onClick={() => onSet("street", s)}
          />
        ))}
      </div>

      {/* Separador */}
      <div
        style={{
          width: 1,
          height: 20,
          background: "rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      />

      {/* Action */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.2)",
            marginRight: 4,
          }}
        >
          Action
        </span>
        {ACTIONS.map((a) => (
          <Chip
            key={a}
            label={a}
            active={filters.action === a}
            onClick={() => onSet("action", a)}
          />
        ))}
      </div>
    </div>
  );
}

import React from "react";
import { C } from "./theme.js";

/**
 * Faixa "Progresso Recente" — layout v0.
 * V1: valores placeholder marcados como "Em breve".
 */
const ITEMS = [
  { label: "Sessões este mês", value: 24,  max: 30,  color: C.pos,  soon: true },
  { label: "Mãos revisadas",   value: 148, max: 200, color: C.info, soon: true },
  { label: "Ranges mapeados",  value: 7,   max: 10,  color: C.warn, soon: true },
];

export default function ProgressStrip() {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.sub, margin: 0, letterSpacing: "0.02em" }}>
          Progresso Recente
        </p>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Julho</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {ITEMS.map((it) => (
          <ProgressCard key={it.label} {...it} />
        ))}
      </div>
    </section>
  );
}

function ProgressCard({ label, value, max, color, soon }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div
      style={{
        position: "relative",
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* topo: label + badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.sub }}>
          {label}
        </span>
        {soon && (
          <span
            style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
              color: C.sub, background: "rgba(255,255,255,0.03)",
              border: `1px solid ${C.line}`, borderRadius: 999,
              padding: "2px 6px", whiteSpace: "nowrap",
            }}
          >
            Em breve
          </span>
        )}
      </div>

      {/* valor grande em destaque */}
      <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
          {value}
        </span>
        <span style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>
          /{max}
        </span>
      </div>

      {/* barra fina */}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          marginTop: 10,
          position: "relative",
          height: 5,
          width: "100%",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 999,
            transition: "width .5s ease",
          }}
        />
      </div>

      <p style={{ marginTop: 8, marginBottom: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
        {pct}% concluído
      </p>
    </div>
  );
}

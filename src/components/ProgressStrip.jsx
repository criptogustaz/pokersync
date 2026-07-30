import React from "react";
import { C } from "./theme.js";

/**
 * Faixa "Progresso Recente" — cards com barras de progresso.
 * V1: valores placeholder marcados como "Em breve" (dados ainda não vêm do back).
 * Quando o back suportar, basta trocar as props `value` e `max` por valores reais
 * e remover o pill "Em breve".
 */
const ITEMS = [
  { label: "Sessões este mês", value: 24,  max: 30,  color: C.pos,   soon: true },
  { label: "Mãos revisadas",   value: 148, max: 200, color: C.info,  soon: true },
  { label: "Ranges mapeados",  value: 7,   max: 10,  color: C.warn,  soon: true },
];

export default function ProgressStrip() {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={{ fontSize: 16, fontWeight: 600, color: C.sub, margin: 0, letterSpacing: "0.02em" }}>
        Progresso Recente
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
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
        borderRadius: 10,
        padding: "18px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        opacity: soon ? 0.7 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.sub, margin: 0 }}>
          {label}
        </p>
        {soon && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.sub,
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${C.line}`,
              borderRadius: 4,
              padding: "2px 7px",
              whiteSpace: "nowrap",
            }}
          >
            Em breve
          </span>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
          {value}
          <span style={{ color: C.sub, fontWeight: 400, fontSize: 16 }}>/{max}</span>
        </span>
      </div>

      <div style={{ position: "relative", height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: pct + "%", background: color, borderRadius: 3, transition: "width .5s ease" }} />
      </div>

      <p style={{ fontSize: 12, color: C.sub, margin: 0 }}>{pct}% concluído</p>
    </div>
  );
}

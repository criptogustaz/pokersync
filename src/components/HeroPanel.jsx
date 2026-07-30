import React, { useEffect, useState } from "react";
import { C } from "./theme.js";
import { fetchSessions, fetchSettings } from "../services/bankrollService.js";
import { aggregate } from "../bankroll/calc.js";

// Fundo decorativo — fichas de poker empilhadas em P&B (SVG inline).
function ChipsBackground() {
  const Chip = ({ cx, cy, r, tone = 1 }) => {
    const grad = `chip-${cx}-${cy}`;
    return (
      <g>
        <defs>
          <radialGradient id={grad} cx="35%" cy="35%">
            <stop offset="0%"  stopColor="#3a3a3a" />
            <stop offset="60%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${grad})`} opacity={tone} />
        <circle cx={cx} cy={cy} r={r * 0.72} fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.35" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4;
          const x1 = cx + Math.cos(a) * (r - 6);
          const y1 = cy + Math.sin(a) * (r - 6);
          const x2 = cx + Math.cos(a) * r;
          const y2 = cy + Math.sin(a) * r;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.4" />;
        })}
      </g>
    );
  };
  return (
    <svg viewBox="0 0 800 260" preserveAspectRatio="xMaxYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.75, pointerEvents: "none" }}>
      <Chip cx={620} cy={150} r={90} />
      <Chip cx={720} cy={90}  r={70} tone={0.9} />
      <Chip cx={560} cy={70}  r={55} tone={0.8} />
      <Chip cx={740} cy={210} r={62} tone={0.85} />
      <Chip cx={470} cy={160} r={48} tone={0.7} />
    </svg>
  );
}

export default function HeroPanel({ apelido, nome }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    bankroll: 0,
    profit: 0,
    roi: 0,
    itm: 0,
    tourneyCount: 0,
    totalSessions: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const [sessions, settings] = await Promise.all([fetchSessions(), fetchSettings()]);
        const agg = aggregate(sessions);
        setData({
          bankroll: (Number(settings.bankroll) || 0) + agg.profit,
          profit: agg.profit,
          roi: agg.roi || 0,
          itm: agg.itm || 0,
          tourneyCount: agg.tourneyCount || 0,
          totalSessions: sessions.length,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const displayName = (apelido && apelido.trim())
    || (nome && nome.split(" ")[0])
    || "Jogador";

  const profitPositive = data.profit >= 0;
  const fmtBRL = (n) => `R$ ${Math.round(n).toLocaleString("pt-BR")}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Banner com fichas P&B + apelido em branco */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 14,
          border: `1px solid ${C.line}`,
          background: "#0a0a0a",
          padding: "48px 40px 44px",
          minHeight: 220,
        }}
      >
        <ChipsBackground />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: C.sub, fontWeight: 700, margin: 0 }}>
            Bem-vindo de volta
          </p>
          <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 10, color: "#FFFFFF", lineHeight: 1.05 }}>
            {displayName}
          </h1>
        </div>
      </div>

      {/* Faixa de métricas fininhas — cards separados abaixo do banner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <MetricPill
          dot={C.pos}
          label="Banca atual"
          value={loading ? "…" : fmtBRL(data.bankroll)}
          hint={data.totalSessions > 0 ? `${data.totalSessions} sessões` : "sem dados ainda"}
        />
        <MetricPill
          dot={profitPositive ? C.pos : C.neg}
          label="Resultado"
          value={loading ? "…" : `${profitPositive ? "+" : ""}${fmtBRL(data.profit)}`}
          hint={loading ? "" : `${data.roi.toFixed(1)}% ROI`}
          hintColor={profitPositive ? C.pos : C.neg}
        />
        <MetricPill
          dot={C.warn}
          label="ITM (torneios)"
          value={loading ? "…" : `${data.itm.toFixed(0)}%`}
          hint={data.tourneyCount > 0 ? `${data.tourneyCount} torneios` : "sem torneios ainda"}
        />
      </div>
    </div>
  );
}

function MetricPill({ dot, label, value, hint, hintColor }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        padding: "14px 20px",
      }}
    >
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: C.sub, margin: 0, whiteSpace: "nowrap", textTransform: "uppercase" }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 0 auto", whiteSpace: "nowrap" }}>{value}</p>
      {hint && (
        <p style={{ fontSize: 12, color: hintColor || C.sub, margin: 0, whiteSpace: "nowrap", fontWeight: 500 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

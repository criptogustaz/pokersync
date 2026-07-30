import React, { useEffect, useState } from "react";
import { Wallet, TrendingUp, Trophy } from "lucide-react";
import { C } from "./theme.js";
import { fetchSessions, fetchSettings } from "../services/bankrollService.js";
import { aggregate } from "../bankroll/calc.js";

/**
 * Faixa de 3 stat cards — layout v0:
 * [ícone quadrado] [dot + label uppercase / valor bold + meta]
 * Puxa dados reais de bankroll (banca, resultado, ROI, ITM).
 */
export default function StatCards() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    bankroll: 0, profit: 0, roi: 0, itm: 0, tourneyCount: 0, totalSessions: 0,
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

  const fmtBRL = (n) => `R$ ${Math.round(n).toLocaleString("pt-BR")}`;
  const profitPositive = data.profit >= 0;

  const stats = [
    {
      icon: Wallet,
      label: "Banca atual",
      value: loading ? "…" : fmtBRL(data.bankroll),
      meta: data.totalSessions > 0 ? `${data.totalSessions} sessões` : "sem dados",
      accent: C.pos,
    },
    {
      icon: TrendingUp,
      label: "Resultado",
      value: loading ? "…" : `${profitPositive ? "+" : ""}${fmtBRL(data.profit)}`,
      meta: loading ? "" : `${data.roi.toFixed(1)}% ROI`,
      accent: profitPositive ? C.pos : C.neg,
    },
    {
      icon: Trophy,
      label: "ITM (torneios)",
      value: loading ? "…" : `${data.itm.toFixed(0)}%`,
      meta: data.tourneyCount > 0 ? `${data.tourneyCount} torneios` : "sem torneios",
      accent: C.warn,
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, meta, accent }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderRadius: 12,
        border: `1px solid ${hovered ? `${accent}55` : C.line}`,
        background: C.panel,
        padding: "12px 16px",
        cursor: "pointer",
        transition: "border-color .2s",
      }}
    >
      {/* Glow do accent no hover */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          right: -32,
          top: -32,
          width: 96,
          height: 96,
          borderRadius: "50%",
          background: `${accent}22`,
          filter: "blur(28px)",
          opacity: hovered ? 1 : 0,
          transition: "opacity .3s",
          pointerEvents: "none",
        }}
      />

      {/* Ícone quadrado lateral */}
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: 9,
          border: `1px solid ${hovered ? `${accent}55` : C.line}`,
          background: "rgba(255,255,255,0.03)",
          transition: "border-color .2s",
        }}
      >
        <Icon size={18} color={hovered ? accent : C.text} strokeWidth={1.6} />
      </span>

      {/* Conteúdo */}
      <div style={{ position: "relative", minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 6, height: 6, borderRadius: "50%", background: accent, flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
              textTransform: "uppercase", color: C.sub,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        </div>
        <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>
            {value}
          </span>
          {meta && (
            <span style={{ fontSize: 11, color: C.sub, whiteSpace: "nowrap" }}>
              {meta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

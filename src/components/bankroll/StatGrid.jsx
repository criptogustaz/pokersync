import React from "react";
import { C, signColor } from "../theme.js";
import { fmtSignedMoney, fmtMoney, fmtPct } from "../../bankroll/format.js";
import { TrendingUp, Percent, Target, Coins } from "lucide-react";

function Stat({ icon: Icon, label, value, color, sub }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        padding: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.sub }}>
        <Icon size={15} />
        <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, marginTop: 10, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function StatGrid({ agg }) {
  const cards = [
    { icon: TrendingUp, label: "Lucro / Prejuízo", value: fmtSignedMoney(agg.profit), color: signColor(agg.profit), sub: `${agg.n} sessões` },
    { icon: Percent, label: "ROI", value: fmtPct(agg.roi), color: signColor(agg.roi), sub: `Investido: ${fmtMoney(agg.totalInvested)}` },
    { icon: Target, label: "ITM (Torneios)", value: `${agg.itm.toFixed(0)}%`, color: C.text, sub: `${agg.itmCount}/${agg.tourneyCount} torneios` },
    { icon: Coins, label: "Avg. Buy-in", value: fmtMoney(agg.avgBuyIn), color: C.text, sub: "stake médio" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16 }}>
      {cards.map((c) => (
        <Stat key={c.label} {...c} />
      ))}
    </div>
  );
}

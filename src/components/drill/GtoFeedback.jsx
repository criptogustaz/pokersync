import React from "react";
import { Check, TrendingDown, Info } from "lucide-react";
import { C } from "../theme.js";
import { matchUserActionToGtoNode } from "../../engine/matchUserActionToGtoNode.js";

const VERDICT = {
  PERFECT: { color: C.pos, bg: "rgba(34,197,94,0.10)", border: "rgba(34,197,94,0.4)", Icon: Check, label: "PERFECT" },
  BLUNDER: { color: C.neg, bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.4)", Icon: TrendingDown, label: "BLUNDER" },
  UNKNOWN: { color: C.info, bg: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.4)", Icon: Info, label: "—" },
};

function Bar({ label, pct, color }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
        <span style={{ color: C.text }}>{label}</span>
        <span style={{ color: C.sub }}>{pct}%</span>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: C.panel2 }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: color }} />
      </div>
    </div>
  );
}

export default function GtoFeedback({ userAction, gtoNodes, context }) {
  const result = matchUserActionToGtoNode(userAction, gtoNodes);
  const v = VERDICT[result.verdict] || VERDICT.UNKNOWN;
  const { Icon } = v;

  const barColor = (n) =>
    n.action === "FOLD" ? C.neg : n.sizing === userAction.sizing && n.action === userAction.action ? C.pos : C.goldSoft;

  const label = (n) => (n.action === "FOLD" ? "Fold" : `${n.action === "RAISE" ? "Raise" : n.action} ${n.sizing}bb`);

  return (
    <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.goldSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
        <h3 style={{ fontSize: 14, fontWeight: 600 }}>Análise GTO</h3>
      </div>
      <div style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>{context}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, background: v.bg, border: `1px solid ${v.border}`, borderRadius: 12, padding: "12px 14px" }}>
        <Icon size={22} color={v.color} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: v.color }}>{v.label}</div>
          <div style={{ fontSize: 12, color: C.sub }}>EV loss: {result.evLoss.toFixed(2)} bb</div>
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 13, color: C.sub, lineHeight: 1.5 }}>
        {result.verdict === "PERFECT" ? (
          <>Sua ação casou o nó GTO dentro da tolerância de sizing (±15%). Frequência da solução neste spot:</>
        ) : (
          <>Ação fora da solução ótima. A linha de maior EV está destacada abaixo:</>
        )}
      </div>

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {gtoNodes.map((n, i) => (
          <Bar key={i} label={label(n)} pct={Math.round((n.freq ?? 0) * 100)} color={barColor(n)} />
        ))}
      </div>
    </section>
  );
}

import React, { useEffect, useRef } from "react";
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

// Extrai { type, sizing } de uma string de ação do solver (ex: "BET 450,000000").
function parseActionString(raw) {
  const parts = String(raw).trim().split(/\s+/);
  const type = parts[0].toUpperCase();
  const sizing = parts[1] ? parseFloat(parts[1].replace(",", ".")) : 0;
  return { type, sizing };
}

function actionLabel({ type, sizing }) {
  if (type === "FOLD") return "Fold";
  if (type === "CHECK") return "Check";
  if (type === "CALL") return "Call";
  return `${type} ${sizing}`;
}

export default function GtoFeedback({ userAction, gtoNodes, heroCards, context, onResult }) {
  const result = matchUserActionToGtoNode(userAction, gtoNodes, heroCards);
  const v = VERDICT[result.verdict] || VERDICT.UNKNOWN;
  const { Icon } = v;

  // Notifica o pai uma única vez por resultado
  const reported = useRef(false);
  useEffect(() => {
    if (!reported.current && onResult) {
      reported.current = true;
      onResult(result);
    }
  }, [result, onResult]);

  // Reset ao trocar de mão
  useEffect(() => {
    reported.current = false;
  }, [userAction]);

  const actions = gtoNodes?.actions ?? [];
  const freqs = gtoNodes?.strategy?.[heroCards] ?? [];

  const barColor = (parsed) =>
    parsed.type === "FOLD"
      ? C.neg
      : parsed.type === userAction.action.toUpperCase() &&
        (parsed.sizing === 0 || parsed.sizing === userAction.sizing)
      ? C.pos
      : C.goldSoft;

  return (
    <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.goldSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
        <h3 style={{ fontSize: 14, fontWeight: 600 }}>Análise GTO</h3>
      </div>
      <div style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>
        {context} {heroCards ? `· Sua mão: ${heroCards}` : ""}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: v.bg, border: `1px solid ${v.border}`, borderRadius: 12, padding: "12px 14px" }}>
        <Icon size={22} color={v.color} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: v.color }}>{v.label}</div>
          <div style={{ fontSize: 12, color: C.sub }}>
            Sua jogada: {Math.round((result.chosenFreq ?? 0) * 100)}% da mistura
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, fontSize: 13, color: C.sub, lineHeight: 1.5 }}>
        {result.verdict === "PERFECT" ? (
          <>Sua ação faz parte relevante da mistura GTO para essa mão. Frequência da solução neste spot:</>
        ) : (
          <>
            Ação com frequência baixa (ou nula) na mistura ideal. A jogada mais frequente para essa mão é{" "}
            <strong style={{ color: C.text }}>{result.topAction}</strong> ({Math.round((result.topFreq ?? 0) * 100)}%):
          </>
        )}
      </div>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {actions.map((raw, i) => {
          const parsed = parseActionString(raw);
          const pct = Math.round((freqs[i] ?? 0) * 100);
          return <Bar key={i} label={actionLabel(parsed)} pct={pct} color={barColor(parsed)} />;
        })}
      </div>
    </section>
  );
}

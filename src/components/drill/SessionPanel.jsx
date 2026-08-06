import React from "react";
import { T, F, num } from "./drillTheme";

/* ==================================================================
   src/components/drill/SessionPanel.jsx   (arquivo novo)

   PROPS
   -----
   hands: número de mãos jogadas na sessão
   evLostSeries: [0, 0.42, 0, 1.8, ...]  — EV perdido em bb por mão,
                                            na ordem em que foram jogadas
   onLine: quantas mãos ficaram na linha do solver

   O total e a média são derivados da série, para não haver duas
   fontes de verdade.

   CALIBRAGEM: os limiares abaixo são provisórios. Com 2500 spots na
   base dá para derivar percentis reais de EV loss por mão e ancorar
   a régua nos dados do próprio produto.
===================================================================*/
const CAL = [
  { max: 0.10, label: "elite",   color: (t) => t.ok },
  { max: 0.30, label: "sólido",  color: (t) => t.warn },
  { max: Infinity, label: "revisar", color: (t) => t.bad },
];

function Sparkline({ data }) {
  const W = 240, H = 40;
  const max = Math.max(0.5, ...data.map(Math.abs));
  const slots = Math.max(data.length, 10);
  const bw = W / slots;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
      style={{ display: "block" }} role="img" aria-label="EV perdido por mão">
      <line x1="0" y1={H - 1} x2={W} y2={H - 1} stroke={T.line} strokeWidth="1" />
      {data.map((d, i) => {
        const v = Math.abs(d);
        const h = Math.max(2, (v / max) * (H - 4));
        const fill = v === 0 ? T.ok : v < 0.3 ? T.warn : T.bad;
        return (
          <rect key={i} x={i * bw + 1.5} y={H - 1 - h} width={Math.max(2, bw - 3)} height={h}
            rx="1.5" fill={fill} opacity={v === 0 ? 0.5 : 0.95} />
        );
      })}
    </svg>
  );
}

export default function SessionPanel({ hands = 0, evLostSeries = [], onLine = 0 }) {
  const total = evLostSeries.reduce((s, v) => s + Math.abs(v), 0);
  const perHand = hands ? total / hands : 0;
  const cal = CAL.find((c) => perHand <= c.max);
  const calColor = cal.color(T);

  if (!hands) {
    return (
      <section style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16, fontFamily: F }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 800, letterSpacing: 0.4, color: T.text }}>Sessão</h2>
        <p style={{ margin: 0, fontSize: 11.5, color: T.dim, lineHeight: 1.6 }}>
          As métricas aparecem quando a primeira mão for jogada.
        </p>
      </section>
    );
  }

  return (
    <section style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16, fontFamily: F }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 800, letterSpacing: 0.4, color: T.text }}>Sessão</h2>

      {/* Métrica principal: custo real, não placar binário */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 30, fontWeight: 800, letterSpacing: -1,
          color: total === 0 ? T.ok : T.bad, ...num,
        }}>
          {total === 0 ? "0.00" : `−${total.toFixed(2)}`}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.dim }}>
          bb perdidos em {hands} {hands === 1 ? "mão" : "mãos"}
        </span>
      </div>

      <div style={{ fontSize: 11, color: T.dim, marginTop: 3, ...num }}>
        {perHand.toFixed(3)} bb/mão ·{" "}
        <span style={{ color: calColor, fontWeight: 700 }}>{cal.label}</span>
        <span style={{ opacity: 0.7 }}> · referência: elite ≤ 0.10 · sólido ≤ 0.30</span>
      </div>

      {/* Série temporal: um pico isolado conta uma história que "0/10" apaga */}
      <div style={{ margin: "13px 0 6px" }}>
        <Sparkline data={evLostSeries} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: T.dim, letterSpacing: 0.5 }}>
        <span>MÃO 1</span>
        <span>EV PERDIDO POR MÃO</span>
        <span>MÃO {hands}</span>
      </div>

      {/* Acertos como métrica secundária */}
      <div style={{
        marginTop: 13, paddingTop: 12, borderTop: `1px solid ${T.line}`,
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
      }}>
        <span style={{ fontSize: 11.5, color: T.dim, fontWeight: 600 }}>Na linha do solver</span>
        <span style={{ fontSize: 11.5, color: T.text, fontWeight: 800, ...num }}>{onLine}/{hands}</span>
      </div>
    </section>
  );
}

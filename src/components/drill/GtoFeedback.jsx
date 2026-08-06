import React from "react";
import { T, F, num, fmtEv, evColor } from "./drillTheme";

/* ==================================================================
   src/components/drill/GtoFeedback.jsx

   PROPS
   -----
   hand: { pot, stack, spr, heroLabel }      // heroLabel: "7♠ 6♥"
   nodes: [                                   // gto_nodes.actions mapeado
     { id:"check", label:"Check",            freq: 62, ev: 0,     note:"..." },
     { id:"b25",   label:"Bet 4.5 bb (25%)", freq: 31, ev: -0.08, note:"..." },
   ]
   chosen: node escolhido pelo jogador (ou null antes de agir)
   Vem de engine/matchUserActionToGtoNode.js — o `ev` é o EV loss em bb
   relativo à melhor ação, então a ação ótima é sempre 0.00.
===================================================================*/

function MetaChip({ label, value, strong }) {
  return (
    <div style={{
      display: "flex", alignItems: "baseline", gap: 5, padding: "4px 9px",
      borderRadius: 8, fontFamily: F,
      background: "rgba(255,255,255,.04)", border: `1px solid ${T.line}`,
    }}>
      <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.8, color: T.dim }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color: strong ? T.accent : T.text, ...num }}>{value}</span>
    </div>
  );
}

export default function GtoFeedback({ hand, nodes = [], chosen = null }) {
  if (!hand) return null;

  return (
    <section style={{
      background: T.panel, border: `1px solid ${T.line}`,
      borderRadius: 16, padding: 16, fontFamily: F,
    }}>
      <h2 style={{ margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: 0.4, color: T.text }}>
        Solução do solver
      </h2>

      {/* SPR em cor de acento: é o único metadado que muda a decisão de sizing */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "11px 0 15px" }}>
        <MetaChip label="POTE" value={`${hand.pot} bb`} />
        <MetaChip label="STACK" value={`${hand.stack} bb`} />
        {hand.spr != null && <MetaChip label="SPR" value={hand.spr} strong />}
        {hand.heroLabel && <MetaChip label="MÃO" value={hand.heroLabel} />}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {nodes.map((a) => {
          const picked = chosen && chosen.id === a.id;
          return (
            <div key={a.id} style={{ opacity: chosen && !picked && a.freq < 5 ? 0.45 : 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
                <span style={{
                  fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
                  color: picked ? T.accent : T.text,
                }}>
                  {a.label}
                  {picked && (
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.6, color: T.accent }}>
                      SUA JOGADA
                    </span>
                  )}
                </span>

                {/* Frequência e EV na mesma linha, EV com largura fixa
                    para a coluna alinhar verticalmente entre as ações */}
                <span style={{ display: "flex", alignItems: "baseline", gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: T.text, ...num }}>{a.freq}%</span>
                  <span style={{
                    fontSize: 11.5, fontWeight: 800, minWidth: 56, textAlign: "right",
                    color: evColor(a.ev), ...num,
                  }}>
                    {fmtEv(a.ev)} bb
                  </span>
                </span>
              </div>

              <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                <div style={{
                  width: `${a.freq}%`, height: "100%", borderRadius: 3, transition: "width .3s ease",
                  background: picked
                    ? `linear-gradient(90deg,${T.accent},#C084FC)`
                    : "linear-gradient(90deg,#334155,#475569)",
                  boxShadow: picked ? `0 0 10px ${T.accent}88` : "none",
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {chosen && (
        <div style={{
          marginTop: 14, padding: "11px 13px", borderRadius: 12,
          background: `${evColor(chosen.ev)}14`,
          border: `1px solid ${evColor(chosen.ev)}55`,
        }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 3, color: evColor(chosen.ev) }}>
            {chosen.ev === 0 ? "Linha do solver" : `Custo do desvio: ${fmtEv(chosen.ev)} bb`}
          </div>
          {chosen.note && (
            <div style={{ fontSize: 11.5, color: T.dim, lineHeight: 1.55 }}>{chosen.note}</div>
          )}
        </div>
      )}
    </section>
  );
}

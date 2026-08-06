import React from "react";
import { T, F, num, fmtEv } from "./drillTheme";

/* ==================================================================
   src/components/drill/ActionBar.jsx

   PROPS
   -----
   actions: [
     { id:"check", label:"Check",    key:"Q", ev: 0,     primary:true },
     { id:"b25",   label:"Bet 4.5",  key:"W", ev: -0.08 },
     { id:"b75",   label:"Bet 13.5", key:"E", ev: -0.62 },
   ]
   Máximo de 3 itens — reflete o dado real (gto_nodes.actions nunca
   passa de Check + 2 BET).

   onAct: (action) => void
   disabled: bool  — trava depois que o jogador escolheu
   showEv: bool    — default true. Passe false se quiser esconder o EV
                     antes da resposta em modo "prova".
===================================================================*/

export function Key({ children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 16, height: 16, padding: "0 4px", borderRadius: 4,
      background: "rgba(255,255,255,.07)", border: `1px solid ${T.line}`,
      color: T.dim, fontFamily: F, fontSize: 9.5, fontWeight: 700, ...num,
    }}>
      {children}
    </span>
  );
}

export default function ActionBar({ actions = [], onAct = () => {}, disabled = false, showEv = true }) {
  if (!actions.length) return null;

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
      {actions.map((a) => (
        <button
          key={a.id}
          onClick={() => !disabled && onAct(a)}
          disabled={disabled}
          aria-keyshortcuts={a.key}
          style={{
            flex: 1, padding: "10px 12px", borderRadius: 12, textAlign: "left",
            cursor: disabled ? "default" : "pointer", fontFamily: F,
            opacity: disabled ? 0.4 : 1, transition: "opacity .2s, transform .1s",
            background: a.primary
              ? `linear-gradient(180deg,${T.accent},#7E22CE)`
              : `linear-gradient(180deg,${T.panelAlt},${T.panel})`,
            border: `1px solid ${a.primary ? "rgba(255,255,255,.25)" : T.line}`,
            boxShadow: a.primary ? `0 6px 18px ${T.accent}40` : "0 2px 8px rgba(0,0,0,.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ color: T.text, fontWeight: 800, fontSize: 13.5 }}>{a.label}</span>
            {a.key && <Key>{a.key}</Key>}
          </div>

          {/* EV no subtítulo: o jogador aprende o custo antes de clicar,
              não só depois de errar. */}
          {showEv && a.ev != null && (
            <div style={{
              marginTop: 3, fontSize: 10.5, fontWeight: 700,
              color: a.ev === 0 ? T.ok : T.dim, ...num,
            }}>
              EV {fmtEv(a.ev)} bb
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

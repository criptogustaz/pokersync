import React from "react";
import Card, { CardBackPair } from "./Card";
import { T, F, POS, ACT, num } from "./drillTheme";

/* ==================================================================
   src/components/drill/PokerTable.jsx

   PROPS
   -----
   hand: objeto da mão ou null (null = mesa zerada, antes do filtro)
     {
       pot: 18,                       // bb
       spr: 1.4,
       board: ["Ah","Kd","5c","2s",null],   // sempre 5 posições
       history: [                     // ruas já jogadas
         { street: "PRÉ",  actions: [{ pos:"BTN", label:"2.5" }] },
         { street: "FLOP", current: true, actions: [{ pos:"BB", label:"check" }] },
       ],
       seats: {
         BTN: { status:"acting", stack:25, cards:["7s","6h"] },
         BB:  { status:"live",   stack:28.5, action:{ type:"check" } },
         UTG: { status:"folded", stack:31,  action:{ type:"fold" } },
         MP:  { status:"empty" },
         ...
       }
     }

   status: "empty" | "folded" | "live" | "acting"
     empty  → cadeira vazia (28% opacidade, sem cartas)
     folded → saiu da mão (42% opacidade + badge Fold)
     live   → na mão, já agiu (opacidade cheia, sem glow)
     acting → na vez (anel de timer + glow + label NA AÇÃO)

   action: { type: "fold"|"check"|"call"|"bet"|"raise", size?: number }
   onOpenFilters: () => void   — CTA do estado zerado
===================================================================*/

/* 8 assentos sempre visíveis. `card` = lado onde as cartas nascem,
   sempre voltado ao centro da mesa. */
const SEATS = [
  { pos: "UTG",   x: 13, y: 30, card: "right" },
  { pos: "UTG+1", x: 34, y: 13, card: "below" },
  { pos: "MP",    x: 66, y: 13, card: "below" },
  { pos: "HJ",    x: 87, y: 30, card: "left" },
  { pos: "CO",    x: 92, y: 62, card: "left" },
  { pos: "BB",    x: 72, y: 84, card: "above" },
  { pos: "BTN",   x: 50, y: 90, card: "above", hero: true },
  { pos: "SB",    x: 28, y: 84, card: "above" },
];

function ActionBadge({ action }) {
  if (!action) return null;
  const a = ACT[action.type] || ACT.check;
  return (
    <div style={{
      padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap", fontFamily: F,
      background: a.bg, color: a.fg, border: `1px solid ${a.bd}`,
      fontSize: 10.5, fontWeight: 700, ...num,
    }}>
      {a.label}{action.size ? ` ${action.size}bb` : ""}
    </div>
  );
}

function Seat({ seat, state }) {
  const col = POS[seat.pos];
  const { status = "empty", stack, action, cards } = state;
  const hero = !!seat.hero;
  const acting = status === "acting";
  const empty = status === "empty";
  const facedown = !hero && (status === "live" || acting);

  const layout = {
    below: { flexDirection: "column" },
    above: { flexDirection: "column-reverse" },
    left:  { flexDirection: "row-reverse", alignItems: "center" },
    right: { flexDirection: "row", alignItems: "center" },
  }[seat.card];

  return (
    <div style={{
      position: "absolute", left: `${seat.x}%`, top: `${seat.y}%`,
      transform: "translate(-50%,-50%)", transition: "opacity .25s ease",
      opacity: empty ? 0.28 : status === "folded" ? 0.42 : 1,
      zIndex: acting ? 5 : 2,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, ...layout }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{ position: "relative", width: 50, height: 50 }}>
            {acting && (
              <svg width="50" height="50" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                <circle cx="25" cy="25" r="23" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="3" />
                <circle cx="25" cy="25" r="23" fill="none" stroke={col.glow} strokeWidth="3"
                  strokeLinecap="round" strokeDasharray="145" strokeDashoffset="38"
                  style={{ filter: `drop-shadow(0 0 6px ${col.glow})` }} />
              </svg>
            )}
            <div style={{
              position: "absolute", inset: 6, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: empty
                ? "rgba(255,255,255,.04)"
                : `radial-gradient(120% 120% at 30% 25%, ${col.glow}, ${col.base} 60%, rgba(0,0,0,.35) 130%)`,
              border: empty ? `1px dashed ${T.line}` : "1px solid rgba(255,255,255,.28)",
              boxShadow: acting
                ? `0 0 22px ${col.glow}, 0 0 0 2px rgba(255,255,255,.25) inset`
                : empty ? "none" : "0 6px 14px rgba(0,0,0,.5)",
              color: empty ? T.dim : "#fff",
              fontFamily: F, fontWeight: 800, fontSize: 12,
            }}>
              {seat.pos}
            </div>
          </div>

          <div style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800, color: empty ? T.dim : T.text, ...num }}>
            {empty ? "—" : `${stack} bb`}
          </div>

          {hero && !empty && (
            <div style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: 1, color: col.glow }}>
              VOCÊ
            </div>
          )}

          <div style={{ minHeight: 17, display: "flex", alignItems: "center" }}>
            {acting ? (
              <span style={{ fontFamily: F, fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6, color: col.glow }}>
                NA AÇÃO
              </span>
            ) : (
              <ActionBadge action={action} />
            )}
          </div>
        </div>

        {facedown && <CardBackPair side={seat.card === "left" ? "left" : "right"} />}

        {hero && cards && (
          <div style={{ display: "flex", gap: 6, paddingBottom: 4 }}>
            {cards.map((c, i) => (
              <div key={i} style={{ transform: `rotate(${i ? 5 : -5}deg)` }}>
                <Card card={c} size="hero" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PokerTable({ hand, onOpenFilters = () => {} }) {
  const active = !!hand;
  const seatData = (p) => (hand?.seats && hand.seats[p]) || { status: "empty" };

  return (
    <div>
      {/* Linha do tempo: o que já aconteceu, rua a rua */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
        padding: "8px 12px", minHeight: 36, borderRadius: 12, overflowX: "auto",
        border: `1px solid ${T.line}`,
        background: "linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015))",
      }}>
        {active ? (
          hand.history.map((h, i) => (
            <React.Fragment key={i}>
              <span style={{
                fontFamily: F, fontSize: 9.5, fontWeight: 800, letterSpacing: 1.2,
                color: h.current ? T.text : T.dim, whiteSpace: "nowrap",
              }}>
                {h.street}
              </span>
              <div style={{ display: "flex", gap: 5 }}>
                {h.actions.map((a, j) => (
                  <span key={j} style={{
                    fontFamily: F, fontSize: 10.5, fontWeight: 700, whiteSpace: "nowrap",
                    color: POS[a.pos]?.glow, opacity: h.current ? 1 : 0.55,
                    padding: "2px 7px", borderRadius: 999,
                    background: `${POS[a.pos]?.base}1F`,
                    border: `1px solid ${POS[a.pos]?.base}55`, ...num,
                  }}>
                    {a.pos} {a.label}
                  </span>
                ))}
              </div>
              {i < hand.history.length - 1 && <span style={{ color: T.line }}>|</span>}
            </React.Fragment>
          ))
        ) : (
          <span style={{ fontFamily: F, fontSize: 11.5, color: T.dim }}>Nenhuma mão carregada</span>
        )}
      </div>

      {/* Mesa */}
      <div style={{ position: "relative", width: "100%", paddingBottom: "64%" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <div style={{
            position: "absolute", inset: "6% 3%", borderRadius: "50%",
            background: "radial-gradient(60% 70% at 50% 38%, #1FA97B 0%, #14795A 38%, #0C5240 66%, #06301F 100%)",
            boxShadow: [
              "0 0 0 10px #0F1418",
              "0 0 0 11px rgba(255,255,255,.10)",
              "0 0 60px rgba(31,169,123,.28)",
              "0 30px 60px rgba(0,0,0,.65)",
              "inset 0 2px 40px rgba(255,255,255,.10)",
              "inset 0 -20px 60px rgba(0,0,0,.45)",
            ].join(", "),
          }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%", pointerEvents: "none",
              background: "radial-gradient(50% 40% at 50% 30%, rgba(255,255,255,.14), transparent 70%)",
            }} />
          </div>

          <div style={{
            position: "absolute", left: "50%", top: "44%", transform: "translate(-50%,-50%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 11, zIndex: 3,
          }}>
            {active ? (
              <>
                <div style={{ display: "flex", gap: 7 }}>
                  {hand.board.map((c, i) => <Card key={i} card={c} />)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 7, padding: "6px 15px",
                    borderRadius: 999, fontFamily: F,
                    background: "linear-gradient(180deg,rgba(10,20,16,.92),rgba(4,10,8,.92))",
                    border: "1px solid rgba(255,255,255,.16)",
                    boxShadow: "0 8px 22px rgba(0,0,0,.55), 0 0 18px rgba(31,169,123,.25)",
                  }}>
                    <span style={{
                      width: 11, height: 11, borderRadius: "50%",
                      background: "linear-gradient(180deg,#34D399,#0F766E)", boxShadow: "0 0 8px #34D399",
                    }} />
                    <span style={{ color: "#fff", fontWeight: 800, fontSize: 16, ...num }}>{hand.pot}</span>
                    <span style={{ color: T.dim, fontSize: 11, fontWeight: 700 }}>bb</span>
                  </div>
                  {/* SPR sob o pote: o número que determina o sizing fica
                      visível enquanto o olho está no board */}
                  {hand.spr != null && (
                    <div style={{
                      fontFamily: F, fontSize: 10, fontWeight: 700, letterSpacing: 1,
                      color: "rgba(233,238,245,.55)", ...num,
                    }}>
                      SPR {hand.spr}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Estado zerado: mesa vazia até o filtro ser aplicado */
              <div style={{ textAlign: "center", maxWidth: 290, fontFamily: F }}>
                <div style={{ display: "flex", gap: 7, justifyContent: "center", marginBottom: 16 }}>
                  {[0, 1, 2, 3, 4].map((i) => <Card key={i} card={null} />)}
                </div>
                <div style={{ color: T.text, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                  Escolha os filtros para começar
                </div>
                <div style={{ color: T.dim, fontSize: 12, lineHeight: 1.5, marginBottom: 14 }}>
                  Defina stack, posição e rua. Só mãos que existem na base aparecem aqui.
                </div>
                <button onClick={onOpenFilters} style={{
                  padding: "9px 20px", borderRadius: 10, cursor: "pointer", fontFamily: F,
                  background: `linear-gradient(180deg,${T.accent},#7E22CE)`,
                  color: "#fff", fontWeight: 800, fontSize: 13,
                  border: "1px solid rgba(255,255,255,.25)",
                  boxShadow: `0 8px 20px ${T.accent}59`,
                }}>
                  Abrir filtros
                </button>
              </div>
            )}
          </div>

          {SEATS.map((s) => (
            <Seat key={s.pos} seat={s} state={seatData(s.pos)} />
          ))}
        </div>
      </div>
    </div>
  );
}

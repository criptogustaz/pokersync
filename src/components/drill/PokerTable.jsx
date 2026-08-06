import React from "react";
import Card, { CardBackPair } from "./Card";
import { T, F, POS, ACT, num } from "./drillTheme";

/* ==================================================================
   src/components/drill/PokerTable.jsx

   Ajustes desta versão para caber sem scroll:
   - Wrapper vira flex column height:100% — a mesa passa a preencher
     a altura DADA pelo container pai (o DrillView reserva flex:1 pra
     ela), em vez de calcular sua altura a partir da largura via
     paddingBottom:64%. O truque antigo estourava a viewport em
     widescreens.
   - Timeline só renderiza quando há `history` de fato. Como a API de
     /api/drills/batch ainda não retorna ações rua a rua, ela some da
     tela por ora — economiza ~48px e evita o scroll horizontal que
     aparecia quando o histórico ficava largo.
   - Slot `children` removido: ActionBar / GtoFeedback vivem no
     DrillView, como irmãos do PokerTable, com altura previsível.

   PROPS
   -----
   hand: objeto no formato { pot, spr, board, history, seats } ou null.
   heroTimer: segundos restantes do timer do herói (opcional).
===================================================================*/

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

function Seat({ seat, state, heroTimer }) {
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

          <div style={{ minHeight: 17, display: "flex", alignItems: "center", gap: 5 }}>
            {acting ? (
              <>
                <span style={{ fontFamily: F, fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6, color: col.glow }}>
                  NA AÇÃO
                </span>
                {hero && heroTimer != null && (
                  <span style={{ fontFamily: F, fontSize: 9.5, fontWeight: 700, color: T.dim, ...num }}>
                    · {heroTimer}s
                  </span>
                )}
              </>
            ) : (
              <ActionBadge action={action} />
            )}
          </div>
        </div>

        {facedown && <CardBackPair side={seat.card === "left" ? "left" : "right"} />}

        {hero && cards && cards.length > 0 && (
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

export default function PokerTable({ hand, heroTimer }) {
  const active = !!hand;
  const history = hand?.history || [];
  const hasHistory = history.length > 0;
  const seatData = (p) => (hand?.seats && hand.seats[p]) || { status: "empty" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Timeline: só quando há histórico rua a rua (hoje: nunca) */}
      {active && hasHistory && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
          padding: "6px 12px", minHeight: 32, borderRadius: 12, overflowX: "auto",
          border: `1px solid ${T.line}`, flexShrink: 0,
          background: "linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015))",
        }}>
          {history.map((h, i) => (
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
              {i < history.length - 1 && <span style={{ color: T.line }}>|</span>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Mesa — ocupa o espaço vertical dado pelo pai (flex:1) */}
      <div style={{ position: "relative", flex: 1, minHeight: 0, width: "100%" }}>
        <div style={{
          position: "absolute", inset: "3% 3%", borderRadius: "50%",
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
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10, zIndex: 3,
        }}>
          {active ? (
            <>
              <div style={{ display: "flex", gap: 7 }}>
                {hand.board.map((c, i) => <Card key={i} card={c} />)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "5px 14px",
                  borderRadius: 999, fontFamily: F,
                  background: "linear-gradient(180deg,rgba(10,20,16,.92),rgba(4,10,8,.92))",
                  border: "1px solid rgba(255,255,255,.16)",
                  boxShadow: "0 8px 22px rgba(0,0,0,.55), 0 0 18px rgba(31,169,123,.25)",
                }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: "linear-gradient(180deg,#34D399,#0F766E)", boxShadow: "0 0 8px #34D399",
                  }} />
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 15, ...num }}>{hand.pot}</span>
                  <span style={{ color: T.dim, fontSize: 11, fontWeight: 700 }}>bb</span>
                </div>
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
            <div style={{ textAlign: "center", maxWidth: 290, fontFamily: F }}>
              <div style={{ display: "flex", gap: 7, justifyContent: "center", marginBottom: 14 }}>
                {[0, 1, 2, 3, 4].map((i) => <Card key={i} card={null} />)}
              </div>
              <div style={{ color: T.text, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                Escolha os filtros para começar
              </div>
              <div style={{ color: T.dim, fontSize: 12, lineHeight: 1.5 }}>
                Defina posição, ação e rua no filtro acima. Só mãos que existem na base aparecem aqui.
              </div>
            </div>
          )}
        </div>

        {SEATS.map((s) => (
          <Seat key={s.pos} seat={s} state={seatData(s.pos)} heroTimer={heroTimer} />
        ))}
      </div>
    </div>
  );
}

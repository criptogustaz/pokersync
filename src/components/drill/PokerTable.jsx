import React from "react";
import Card, { CardBackPair } from "./Card";
import { T, F, POS, ACT, num } from "./drillTheme";

/* ==================================================================
   src/components/drill/PokerTable.jsx  (v4)

   Correções desta versão:
   - Fundo do felt em verde bem mais escuro (~ #052A1F no centro),
     dando ao branco/verde do pote e das cartas contraste real.
   - Contorno preto grosso em volta da mesa (4px sólido + halo sutil),
     separando o felt do fundo preto da tela.
   - Seats: só quem está `acting` recebe cor viva + glow + pulse. Os
     demais viram cinza neutro em ~24% de opacidade — ficam ali como
     presença, sem competir com o foco. Vazios em 12%.
   - Herói (BTN) passou a usar layout lateral: cartas à esquerda, info
     à direita. Antes as cartas subiam pra dentro da mesa e brigavam
     com o pote. Agora ficam fora do felt.
   - Cartas do herói em tamanho `board` (não `hero`) — menores e mais
     coerentes com o resto.
   - Transições suaves em opacidade/transform (180ms).

   PROPS
   -----
   hand: objeto no formato { pot, spr, board, history, seats } ou null.
   heroTimer: segundos restantes do timer do herói (opcional).
===================================================================*/

const SEATS = [
  { pos: "UTG",   x: 13, y: 30, card: "right" },
  { pos: "UTG+1", x: 34, y: 12, card: "below" },
  { pos: "MP",    x: 66, y: 12, card: "below" },
  { pos: "HJ",    x: 87, y: 30, card: "left" },
  { pos: "CO",    x: 92, y: 62, card: "left" },
  { pos: "BB",    x: 74, y: 84, card: "above" },
  { pos: "BTN",   x: 50, y: 92, card: "above", hero: true },
  { pos: "SB",    x: 26, y: 84, card: "above" },
];

const NEUTRAL = "#3A4048";   // cinza que representa "presente mas não ativo"
const NEUTRAL_GLOW = "#5A6270";

function ActionBadge({ action }) {
  if (!action) return null;
  const a = ACT[action.type] || ACT.check;
  return (
    <div style={{
      padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap", fontFamily: F,
      background: a.bg, color: a.fg, border: `1px solid ${a.bd}`,
      fontSize: 10.5, fontWeight: 700, ...num,
      animation: "fadeInUp 200ms ease-out",
    }}>
      {a.label}{action.size ? ` ${action.size}bb` : ""}
    </div>
  );
}

function Seat({ seat, state, heroTimer }) {
  const posCol = POS[seat.pos];
  const { status = "empty", stack, action, cards } = state;
  const hero = !!seat.hero;
  const acting = status === "acting";
  const empty = status === "empty";
  const facedown = !hero && (status === "live" || acting);

  /* Cores: só o `acting` usa a paleta viva da posição. Todo o resto
     usa cinza neutro em opacidade baixa. */
  const col = acting ? posCol : { base: NEUTRAL, glow: NEUTRAL_GLOW };

  const opacity = acting ? 1 : status === "live" ? 0.24 : status === "folded" ? 0.18 : 0.12;

  const layout = {
    below: { flexDirection: "column" },
    above: { flexDirection: "column-reverse" },
    left:  { flexDirection: "row-reverse", alignItems: "center" },
    right: { flexDirection: "row", alignItems: "center" },
    heroSide: { flexDirection: "row", alignItems: "center", gap: 8 },
  }[hero ? "heroSide" : seat.card];

  const badgeArea = (
    <div style={{ minHeight: 17, display: "flex", alignItems: "center", gap: 5 }}>
      {acting ? (
        <>
          <span style={{
            fontFamily: F, fontSize: 9.5, fontWeight: 800, letterSpacing: 0.6,
            color: col.glow, textShadow: `0 0 8px ${col.glow}`,
          }}>
            NA AÇÃO
          </span>
          {hero && heroTimer != null && (
            <span style={{ fontFamily: F, fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.55)", ...num }}>
              · {heroTimer}s
            </span>
          )}
        </>
      ) : (
        <ActionBadge action={action} />
      )}
    </div>
  );

  const seatInfo = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div style={{ position: "relative", width: 46, height: 46 }}>
        {acting && (
          <svg width="46" height="46" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="23" cy="23" r="21" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="3" />
            <circle cx="23" cy="23" r="21" fill="none" stroke={col.glow} strokeWidth="3"
              strokeLinecap="round" strokeDasharray="132" strokeDashoffset="34"
              style={{ filter: `drop-shadow(0 0 8px ${col.glow})` }} />
          </svg>
        )}
        <div style={{
          position: "absolute", inset: 6, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: empty
            ? "rgba(255,255,255,.03)"
            : acting
              ? `radial-gradient(120% 120% at 30% 25%, ${col.glow}, ${col.base} 60%, rgba(0,0,0,.4) 130%)`
              : `linear-gradient(160deg, ${NEUTRAL} 0%, #22262C 100%)`,
          border: empty
            ? `1px dashed rgba(255,255,255,.15)`
            : acting
              ? "1px solid rgba(255,255,255,.35)"
              : "1px solid rgba(255,255,255,.10)",
          boxShadow: acting
            ? `0 0 24px ${col.glow}, 0 0 0 2px rgba(255,255,255,.28) inset, 0 4px 12px #000`
            : empty ? "none" : "0 3px 8px rgba(0,0,0,.55)",
          color: empty ? "rgba(255,255,255,.3)" : "#fff",
          fontFamily: F, fontWeight: 800, fontSize: 11.5,
          transition: "all 200ms ease",
        }}>
          {seat.pos}
        </div>
      </div>

      <div style={{
        fontFamily: F, fontSize: 11.5, fontWeight: 800,
        color: empty ? "rgba(255,255,255,.3)" : acting ? "#fff" : "rgba(255,255,255,.75)",
        ...num,
        textShadow: "0 1px 2px rgba(0,0,0,.8)",
      }}>
        {empty ? "—" : `${stack} bb`}
      </div>

      {hero && !empty && (
        <div style={{
          fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: 1,
          color: acting ? col.glow : "rgba(255,255,255,.5)",
          textShadow: acting ? `0 0 6px ${col.glow}` : "none",
        }}>
          VOCÊ
        </div>
      )}

      {badgeArea}
    </div>
  );

  return (
    <div style={{
      position: "absolute", left: `${seat.x}%`, top: `${seat.y}%`,
      transform: "translate(-50%,-50%)",
      opacity, transition: "opacity 220ms ease",
      zIndex: acting ? 5 : 2,
      animation: acting ? "seatPulse 2s ease-in-out infinite" : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, ...layout }}>
        {hero ? (
          <>
            {/* Herói: cartas à esquerda, info à direita — fica fora do felt */}
            {cards && cards.length > 0 && (
              <div style={{ display: "flex", gap: 5 }}>
                {cards.map((c, i) => (
                  <div key={i} style={{
                    transform: `rotate(${i ? 4 : -4}deg)`,
                    animation: "fadeInUp 260ms ease-out both",
                    animationDelay: `${i * 60}ms`,
                  }}>
                    <Card card={c} size="board" />
                  </div>
                ))}
              </div>
            )}
            {seatInfo}
          </>
        ) : (
          <>
            {seatInfo}
            {facedown && <CardBackPair side={seat.card === "left" ? "left" : "right"} />}
          </>
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
      <style>{`
        @keyframes seatPulse {
          0%, 100% { filter: drop-shadow(0 0 0px rgba(255,255,255,0)); }
          50% { filter: drop-shadow(0 0 6px rgba(255,255,255,0.15)); }
        }
        @keyframes cardDeal {
          from { opacity: 0; transform: translateY(-8px) rotate(-4deg); }
          to { opacity: 1; transform: translateY(0) rotate(0); }
        }
      `}</style>

      {active && hasHistory && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
          padding: "6px 12px", minHeight: 32, borderRadius: 12, overflowX: "auto",
          border: `1px solid rgba(255,255,255,0.08)`, flexShrink: 0,
          background: "rgba(255,255,255,0.03)",
        }}>
          {history.map((h, i) => (
            <React.Fragment key={i}>
              <span style={{
                fontFamily: F, fontSize: 9.5, fontWeight: 800, letterSpacing: 1.2,
                color: h.current ? "#fff" : "rgba(255,255,255,.4)", whiteSpace: "nowrap",
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
              {i < history.length - 1 && <span style={{ color: "rgba(255,255,255,.1)" }}>|</span>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* MESA — altura preenche o container pai */}
      <div style={{ position: "relative", flex: 1, minHeight: 0, width: "100%" }}>
        {/* Contorno preto forte + halo sutil separam a mesa do fundo */}
        <div style={{
          position: "absolute", inset: "2% 2%", borderRadius: "50%",
          /* Verde bem mais escuro: quase preto na borda, verde-musgo no centro */
          background: "radial-gradient(65% 75% at 50% 40%, #0F5A42 0%, #0A4231 30%, #062E22 60%, #031810 100%)",
          border: "2px solid #000000",
          boxShadow: [
            "0 0 0 6px #000000",
            "0 0 0 7px rgba(255,255,255,.08)",
            "0 0 40px rgba(15,90,66,.35)",
            "0 24px 60px rgba(0,0,0,.75)",
            "inset 0 2px 30px rgba(255,255,255,.06)",
            "inset 0 -30px 80px rgba(0,0,0,.65)",
          ].join(", "),
        }}>
          {/* Brilho sutil no topo do felt */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%", pointerEvents: "none",
            background: "radial-gradient(55% 35% at 50% 25%, rgba(255,255,255,.09), transparent 70%)",
          }} />
          {/* Anel interno claro (definição da borda do felt) */}
          <div style={{
            position: "absolute", inset: "3%", borderRadius: "50%", pointerEvents: "none",
            border: "1px solid rgba(255,255,255,.06)",
          }} />
        </div>

        {/* Board + pote centrais */}
        <div style={{
          position: "absolute", left: "50%", top: "44%", transform: "translate(-50%,-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10, zIndex: 3,
        }}>
          {active ? (
            <>
              <div style={{ display: "flex", gap: 7 }}>
                {hand.board.map((c, i) => (
                  <div key={i} style={{
                    animation: "cardDeal 300ms ease-out both",
                    animationDelay: `${i * 70}ms`,
                  }}>
                    <Card card={c} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "5px 14px",
                  borderRadius: 999, fontFamily: F,
                  background: "linear-gradient(180deg,#000000,#0A0A0A)",
                  border: "1px solid rgba(255,255,255,.20)",
                  boxShadow: "0 8px 22px rgba(0,0,0,.7), 0 0 20px rgba(52,211,153,.25)",
                }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: "linear-gradient(180deg,#34D399,#0F766E)",
                    boxShadow: "0 0 10px #34D399",
                  }} />
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 15, ...num }}>{hand.pot}</span>
                  <span style={{ color: "rgba(255,255,255,.5)", fontSize: 11, fontWeight: 700 }}>bb</span>
                </div>
                {hand.spr != null && (
                  <div style={{
                    fontFamily: F, fontSize: 10, fontWeight: 700, letterSpacing: 1,
                    color: "rgba(255,255,255,.5)", ...num,
                    textShadow: "0 1px 2px #000",
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
              <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                Escolha os filtros para começar
              </div>
              <div style={{ color: "rgba(255,255,255,.5)", fontSize: 12, lineHeight: 1.5 }}>
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

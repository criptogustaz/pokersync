import React, { useState } from "react";

/* ------------------------------------------------------------------
   PokerTable — Modo Treino (v2)
   No projeto real, troque o bloco C/font abaixo por:
   import { C, font } from "../theme";
-------------------------------------------------------------------*/
const C = {
  bg: "#0B0D10",
  panel: "#12161C",
  line: "#232A33",
  text: "#E9EEF5",
  dim: "#8A94A3",
};
const font = "'Inter', system-ui, sans-serif";

/* 1) Cor própria por posição — hue distinta e memorizável.
   Ordem de ação horária: cores frias no early, quentes no late.
   Isso vira código visual: o grinder identifica a posição pela cor
   antes de ler o texto (reconhecimento > leitura). */
const POS = {
  UTG:     { base: "#3B82F6", glow: "#60A5FA" }, // azul
  "UTG+1": { base: "#06B6D4", glow: "#22D3EE" }, // ciano
  MP:      { base: "#10B981", glow: "#34D399" }, // verde
  HJ:      { base: "#EAB308", glow: "#FACC15" }, // âmbar
  CO:      { base: "#F97316", glow: "#FB923C" }, // laranja
  BTN:     { base: "#A855F7", glow: "#C084FC" }, // roxo (herói)
  SB:      { base: "#EC4899", glow: "#F472B6" }, // rosa
  BB:      { base: "#EF4444", glow: "#F87171" }, // vermelho
};

/* Geometria: 8 assentos SEMPRE visíveis, ancorados na borda da elipse.
   `card` = lado em que as cartas nascem, sempre voltado ao centro
   (evita corte e dá leitura orgânica de "mão sobre a mesa"). */
const SEATS = [
  { pos: "UTG",   x: 13,  y: 30, card: "right" },
  { pos: "UTG+1", x: 34,  y: 13, card: "below" },
  { pos: "MP",    x: 66,  y: 13, card: "below" },
  { pos: "HJ",    x: 87,  y: 30, card: "left"  },
  { pos: "CO",    x: 92,  y: 62, card: "left"  },
  { pos: "BB",    x: 72,  y: 84, card: "above" },
  { pos: "BTN",   x: 50,  y: 90, card: "above", hero: true },
  { pos: "SB",    x: 28,  y: 84, card: "above" },
];

const SUITS = {
  h: { g: "♥", c: "#FF3B57" },
  d: { g: "♦", c: "#2E9BFF" },
  c: { g: "♣", c: "#22C55E" },
  s: { g: "♠", c: "#111820" },
};

/* ---------------------------- Carta aberta ---------------------------- */
function Card({ card, size = "board" }) {
  const s = size === "hero" ? { w: 62, h: 88, r: 22, g: 34 } : { w: 54, h: 76, r: 19, g: 29 };
  if (!card) {
    return (
      <div
        style={{
          width: s.w, height: s.h, borderRadius: 9,
          border: `1px dashed ${C.line}`,
          background: "rgba(255,255,255,.02)",
        }}
      />
    );
  }
  const rank = card.slice(0, -1);
  const su = SUITS[card.slice(-1)];
  return (
    <div
      style={{
        width: s.w, height: s.h, borderRadius: 9,
        background: "linear-gradient(160deg,#FFFFFF 0%,#F2F6FA 55%,#E4EBF2 100%)",
        boxShadow: "0 8px 18px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.9) inset",
        position: "relative", fontFamily: font, color: su.c, overflow: "hidden",
      }}
    >
      <span style={{ position: "absolute", top: 4, left: 6, fontSize: s.r, fontWeight: 800, lineHeight: 1 }}>{rank}</span>
      <span style={{ position: "absolute", top: s.r + 5, left: 7, fontSize: 13 }}>{su.g}</span>
      <span style={{ position: "absolute", right: 6, bottom: 5, fontSize: s.g, opacity: 0.9 }}>{su.g}</span>
    </div>
  );
}

/* --------------------------- Cartas viradas ---------------------------
   Leque com rotação simétrica e wrapper com padding — nada de clipping. */
function FacedownPair({ side }) {
  const back = (rot, z) => (
    <div
      style={{
        width: 26, height: 37, borderRadius: 5, transform: `rotate(${rot}deg)`,
        marginLeft: z ? -9 : 0,
        background: "linear-gradient(150deg,#1E3A5F 0%,#16324F 50%,#0E2338 100%)",
        boxShadow: "0 4px 10px rgba(0,0,0,.6), 0 0 0 1px rgba(120,180,255,.28) inset",
        position: "relative",
      }}
    >
      <div style={{
        position: "absolute", inset: 4, borderRadius: 3,
        border: "1px solid rgba(120,180,255,.22)",
        background: "repeating-linear-gradient(45deg,rgba(120,180,255,.10) 0 2px,transparent 2px 4px)",
      }} />
    </div>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", padding: 4, filter: "drop-shadow(0 0 6px rgba(0,0,0,.5))" }}>
      {back(side === "left" ? 8 : -8, false)}
      {back(side === "left" ? -6 : 6, true)}
    </div>
  );
}

/* -------------------------- Badge de ação ---------------------------- */
const ACT = {
  fold:  { label: "Fold",  bg: "rgba(120,130,145,.18)", fg: "#9AA5B4", bd: "rgba(150,160,175,.35)" },
  check: { label: "Check", bg: "rgba(56,189,248,.14)",  fg: "#7DD3FC", bd: "rgba(56,189,248,.45)" },
  call:  { label: "Call",  bg: "rgba(34,197,94,.16)",   fg: "#4ADE80", bd: "rgba(34,197,94,.5)" },
  bet:   { label: "Bet",   bg: "rgba(249,115,22,.18)",  fg: "#FDBA74", bd: "rgba(249,115,22,.55)" },
  raise: { label: "Raise", bg: "rgba(239,68,68,.18)",   fg: "#FCA5A5", bd: "rgba(239,68,68,.55)" },
};

function ActionBadge({ action }) {
  if (!action) return null;
  const a = ACT[action.type] || ACT.check;
  return (
    <div style={{
      padding: "2px 8px", borderRadius: 999, background: a.bg, color: a.fg,
      border: `1px solid ${a.bd}`, fontSize: 10.5, fontWeight: 700, letterSpacing: .3,
      whiteSpace: "nowrap", fontFamily: font, backdropFilter: "blur(4px)",
    }}>
      {a.label}{action.size ? ` ${action.size}bb` : ""}
    </div>
  );
}

/* ------------------------------ Assento ------------------------------ */
function Seat({ seat, state }) {
  const color = POS[seat.pos];
  const { status, stack, action, hero, cards } = state; // status: empty | folded | live | acting
  const acting = status === "acting";
  const folded = status === "folded";
  const empty = status === "empty";

  const opacity = empty ? 0.28 : folded ? 0.42 : 1;
  const dir = seat.card;

  const facedown = !hero && (status === "live" || acting);

  const avatar = (
    <div style={{ position: "relative", width: 54, height: 54 }}>
      {/* 3) Anel + timer aparecem SÓ em quem está na ação */}
      {acting && (
        <svg width="54" height="54" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <circle cx="27" cy="27" r="25" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="3" />
          <circle
            cx="27" cy="27" r="25" fill="none" stroke={color.glow} strokeWidth="3"
            strokeLinecap="round" strokeDasharray="157" strokeDashoffset="42"
            style={{ filter: `drop-shadow(0 0 6px ${color.glow})` }}
          />
        </svg>
      )}
      <div style={{
        position: "absolute", inset: 6, borderRadius: "50%",
        background: empty
          ? "rgba(255,255,255,.04)"
          : `radial-gradient(120% 120% at 30% 25%, ${color.glow} 0%, ${color.base} 60%, rgba(0,0,0,.35) 130%)`,
        border: empty ? `1px dashed ${C.line}` : `1px solid rgba(255,255,255,.28)`,
        boxShadow: acting
          ? `0 0 22px ${color.glow}, 0 0 0 2px rgba(255,255,255,.25) inset`
          : empty ? "none" : `0 6px 14px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.10) inset`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: empty ? C.dim : "#fff", fontWeight: 800, fontSize: 13, fontFamily: font,
        letterSpacing: .2, textShadow: "0 1px 2px rgba(0,0,0,.5)",
      }}>
        {seat.pos}
      </div>
    </div>
  );

  const info = (
    <div style={{ textAlign: "center", fontFamily: font, lineHeight: 1.25 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: empty ? C.dim : C.text }}>
        {empty ? "—" : `${stack} bb`}
      </div>
      {hero && <div style={{ fontSize: 9.5, color: color.glow, fontWeight: 700, letterSpacing: 1 }}>VOCÊ</div>}
    </div>
  );

  const block = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      {avatar}
      {info}
      <div style={{ minHeight: 18, display: "flex", alignItems: "center" }}>
        {acting
          ? <div style={{ fontSize: 10, fontWeight: 700, color: color.glow, letterSpacing: .6, fontFamily: font }}>NA AÇÃO</div>
          : <ActionBadge action={action} />}
      </div>
    </div>
  );

  const layout = {
    below: { flexDirection: "column", gap: 2 },
    above: { flexDirection: "column-reverse", gap: 2 },
    left:  { flexDirection: "row-reverse", alignItems: "center", gap: 2 },
    right: { flexDirection: "row", alignItems: "center", gap: 2 },
  }[dir];

  return (
    <div style={{
      position: "absolute", left: `${seat.x}%`, top: `${seat.y}%`,
      transform: "translate(-50%,-50%)", opacity,
      transition: "opacity .25s ease", zIndex: acting ? 5 : 2,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", ...layout }}>
        {block}
        {facedown && <FacedownPair side={dir === "left" ? "left" : "right"} />}
        {hero && cards && (
          <div style={{ display: "flex", gap: 6, paddingBottom: 4 }}>
            {cards.map((c, i) => (
              <div key={i} style={{ transform: `rotate(${i === 0 ? -5 : 5}deg)` }}>
                <Card card={c} size="hero" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- Mesa completa ---------------------------- */
export function PokerTable({ hand, onOpenFilters = () => {} }) {
  const active = !!hand;
  const seatData = (pos) => (hand?.seats?.[pos]) || { status: "empty" };

  return (
    <div style={{
      background: C.bg, padding: "18px 16px 26px", fontFamily: font,
      borderRadius: 20, position: "relative",
    }}>
      {/* 5) Linha do tempo da mão — o que já aconteceu, rua a rua */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
        padding: "8px 12px", borderRadius: 12,
        background: "linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015))",
        border: `1px solid ${C.line}`, minHeight: 38, overflowX: "auto",
      }}>
        {active ? (
          hand.history.map((h, i) => (
            <React.Fragment key={i}>
              <span style={{
                fontSize: 9.5, fontWeight: 800, letterSpacing: 1.2,
                color: h.current ? "#FFFFFF" : C.dim,
              }}>
                {h.street}
              </span>
              <div style={{ display: "flex", gap: 5 }}>
                {h.actions.map((a, j) => (
                  <span key={j} style={{
                    fontSize: 10.5, fontWeight: 700, fontFamily: font,
                    color: POS[a.pos]?.glow, opacity: h.current ? 1 : .55,
                    padding: "2px 7px", borderRadius: 999,
                    background: `${POS[a.pos]?.base}1F`,
                    border: `1px solid ${POS[a.pos]?.base}55`,
                  }}>
                    {a.pos} {a.label}
                  </span>
                ))}
              </div>
              {i < hand.history.length - 1 && <span style={{ color: C.line }}>|</span>}
            </React.Fragment>
          ))
        ) : (
          <span style={{ fontSize: 11.5, color: C.dim, letterSpacing: .4 }}>
            Nenhuma mão carregada
          </span>
        )}
      </div>

      {/* Mesa */}
      <div style={{ position: "relative", width: "100%", paddingBottom: "62%" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          {/* 7) Feltro com brilho: aro externo + rim light + vinheta */}
          <div style={{
            position: "absolute", inset: "6% 3%",
            borderRadius: "50%",
            background: `
              radial-gradient(60% 70% at 50% 38%, #1FA97B 0%, #14795A 38%, #0C5240 66%, #06301F 100%)`,
            boxShadow: `
              0 0 0 10px #0F1418,
              0 0 0 11px rgba(255,255,255,.10),
              0 0 60px rgba(31,169,123,.28),
              0 30px 60px rgba(0,0,0,.65),
              inset 0 2px 40px rgba(255,255,255,.10),
              inset 0 -20px 60px rgba(0,0,0,.45)`,
          }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "radial-gradient(50% 40% at 50% 30%, rgba(255,255,255,.14), transparent 70%)",
              pointerEvents: "none",
            }} />
          </div>

          {/* Centro: board + pote, ou estado zerado */}
          <div style={{
            position: "absolute", left: "50%", top: "44%", transform: "translate(-50%,-50%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12, zIndex: 3,
          }}>
            {active ? (
              <>
                <div style={{ display: "flex", gap: 7 }}>
                  {hand.board.map((c, i) => <Card key={i} card={c} />)}
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "7px 16px", borderRadius: 999,
                  background: "linear-gradient(180deg,rgba(10,20,16,.92),rgba(4,10,8,.92))",
                  border: "1px solid rgba(255,255,255,.16)",
                  boxShadow: "0 8px 22px rgba(0,0,0,.55), 0 0 18px rgba(31,169,123,.25)",
                }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: "linear-gradient(180deg,#34D399,#0F766E)", boxShadow: "0 0 8px #34D399" }} />
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>{hand.pot}</span>
                  <span style={{ color: C.dim, fontSize: 11, fontWeight: 700 }}>bb</span>
                </div>
              </>
            ) : (
              /* 6) Estado zerado: mesa vazia, convite claro à ação */
              <div style={{ textAlign: "center", maxWidth: 300 }}>
                <div style={{ display: "flex", gap: 7, justifyContent: "center", marginBottom: 16 }}>
                  {[0, 1, 2, 3, 4].map((i) => <Card key={i} card={null} />)}
                </div>
                <div style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                  Escolha os filtros para começar
                </div>
                <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.5, marginBottom: 14 }}>
                  Defina stack, posição e rua. Só mãos que existem na base aparecem aqui.
                </div>
                <button
                  onClick={onOpenFilters}
                  style={{
                    padding: "9px 20px", borderRadius: 10, cursor: "pointer",
                    background: "linear-gradient(180deg,#A855F7,#7E22CE)",
                    color: "#fff", fontWeight: 800, fontSize: 13, fontFamily: font,
                    border: "1px solid rgba(255,255,255,.25)",
                    boxShadow: "0 8px 20px rgba(168,85,247,.35)",
                  }}
                >
                  Abrir filtros
                </button>
              </div>
            )}
          </div>

          {/* Assentos — sempre os 8 */}
          {SEATS.map((s) => (
            <Seat key={s.pos} seat={s} state={{ ...seatData(s.pos), hero: s.hero }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   DEMO — apaga este bloco ao integrar; DrillView passa `hand`.
-------------------------------------------------------------------*/
export default function PokerTableDemo() {
  const [on, setOn] = useState(true);
  const hand = {
    pot: 18,
    board: ["Ah", "Kd", "5c", "2s", null],
    history: [
      { street: "PRÉ", actions: [{ pos: "BTN", label: "2.5" }, { pos: "BB", label: "call" }] },
      { street: "FLOP", current: true, actions: [{ pos: "BB", label: "check" }, { pos: "BTN", label: "bet 6" }] },
    ],
    seats: {
      UTG:     { status: "folded", stack: 31, action: { type: "fold" } },
      "UTG+1": { status: "folded", stack: 31, action: { type: "fold" } },
      MP:      { status: "empty" },
      HJ:      { status: "folded", stack: 31, action: { type: "fold" } },
      CO:      { status: "empty" },
      BB:      { status: "acting", stack: 28.5 },
      BTN:     { status: "live", stack: 25, action: { type: "bet", size: 6 }, cards: ["7s", "6h"] },
      SB:      { status: "folded", stack: 30.5, action: { type: "fold" } },
    },
  };
  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: 20 }}>
      <button
        onClick={() => setOn(!on)}
        style={{ marginBottom: 14, padding: "7px 14px", borderRadius: 8, background: C.panel, color: C.text, border: `1px solid ${C.line}`, fontFamily: font, fontSize: 12, cursor: "pointer" }}
      >
        {on ? "Ver estado zerado" : "Ver mão carregada"}
      </button>
      <PokerTable hand={on ? hand : null} />
    </div>
  );
}

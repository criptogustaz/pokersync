import React, { useEffect, useRef, useState } from "react";
import { C } from "../theme.js";
import Card from "./Card.jsx";

const font = "'Rajdhani', system-ui, sans-serif";

// Cores por posição — mesma paleta do Figma.
const POS_CFG = {
  BTN: { bg: "#6d28d9", ring: "#a78bfa" },
  SB: { bg: "#92400e", ring: "#fbbf24" },
  BB: { bg: "#991b1b", ring: "#fca5a5" },
  UTG: { bg: "#075985", ring: "#38bdf8" },
  "UTG+1": { bg: "#0c4a6e", ring: "#7dd3fc" },
  MP: { bg: "#065f46", ring: "#34d399" },
  HJ: { bg: "#1e3a5f", ring: "#60a5fa" },
  CO: { bg: "#3b0764", ring: "#c4b5fd" },
};

// ─── Fichas 3D (cores por faixa de valor, igual ao Figma) ──────────────────
const CHIP_TIERS = [
  { bg: "#e8e8e8", rim: "#bbb", center: "#f4f4f4", min: 0, max: 0.9 },
  { bg: "#cc2222", rim: "#8b0000", center: "#ee5555", min: 1, max: 4.9 },
  { bg: "#1e8a3e", rim: "#0f5c28", center: "#3cc466", min: 5, max: 24.9 },
  { bg: "#1a5fbb", rim: "#0d3d7a", center: "#3d8ee8", min: 25, max: 99.9 },
  { bg: "#1c1c1c", rim: "#000", center: "#444", min: 100, max: 999999 },
];
const getChipTier = (bb) => CHIP_TIERS.find((c) => bb >= c.min && bb <= c.max) || CHIP_TIERS[0];

function Chip3D({ amountBB, size = 22 }) {
  const c = getChipTier(amountBB);
  const rx = size * 0.5, ry = size * 0.28, depth = size * 0.22;
  const cx = size / 2, cyT = ry + 1, cyB = cyT + depth, H = cyB + ry + 2;
  const uid = `ch${c.min}-${size}`;
  return (
    <svg width={size} height={H} viewBox={`0 0 ${size} ${H}`} style={{ flexShrink: 0, display: "block" }}>
      <defs>
        <linearGradient id={`s${uid}`} x1="0%" x2="100%">
          <stop offset="0%" stopColor={c.rim} />
          <stop offset="30%" stopColor={c.bg} />
          <stop offset="70%" stopColor={c.bg} />
          <stop offset="100%" stopColor={c.rim} />
        </linearGradient>
        <radialGradient id={`f${uid}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor={c.center} />
          <stop offset="55%" stopColor={c.bg} />
          <stop offset="100%" stopColor={c.rim} />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cyB} rx={rx} ry={ry} fill={c.rim} />
      <path d={`M${cx - rx},${cyT}L${cx - rx},${cyB}a${rx},${ry} 0 0 0 ${rx * 2},0L${cx + rx},${cyT}a${rx},${ry} 0 0 1 ${-rx * 2},0`} fill={`url(#s${uid})`} />
      {[...Array(8)].map((_, i) => {
        const a = (i / 8) * Math.PI;
        const x1 = cx + rx * Math.cos(Math.PI + a);
        return <line key={i} x1={x1} y1={cyT + ry * 0.15} x2={x1} y2={cyB - ry * 0.15} stroke="rgba(255,255,255,.55)" strokeWidth={0.8} />;
      })}
      <ellipse cx={cx} cy={cyT} rx={rx} ry={ry} fill={`url(#f${uid})`} stroke={c.rim} strokeWidth={0.8} />
      <ellipse cx={cx} cy={cyT} rx={rx * 0.72} ry={ry * 0.72} fill="none" stroke="rgba(255,255,255,.28)" strokeWidth={0.8} />
      <ellipse cx={cx} cy={cyT} rx={rx * 0.46} ry={ry * 0.46} fill={c.center} stroke="rgba(255,255,255,.3)" strokeWidth={0.5} />
      <ellipse cx={cx - rx * 0.15} cy={cyT - ry * 0.28} rx={rx * 0.28} ry={ry * 0.14} fill="rgba(255,255,255,.22)" />
    </svg>
  );
}

function ChipStack({ amountBB, count = 3, size = 20 }) {
  const ry = size * 0.28, depth = size * 0.22, chipH = ry * 2 + depth + 3, slice = depth;
  const stackH = chipH + slice * (count - 1);
  return (
    <div style={{ position: "relative", width: size, height: stackH, flexShrink: 0 }}>
      {[...Array(count)].map((_, i) => (
        <div key={i} style={{ position: "absolute", top: (count - 1 - i) * slice, left: 0, filter: `brightness(${0.7 + (i / Math.max(count - 1, 1)) * 0.3})` }}>
          <Chip3D amountBB={amountBB} size={size} />
        </div>
      ))}
    </div>
  );
}

// ─── Timer do herói ─────────────────────────────────────────────────────────
function Clock({ seconds, total = 30 }) {
  const size = 38;
  const col = seconds > 15 ? (C.pos || "#2ecc71") : seconds > 8 ? "#f5a623" : C.neg;
  const cx = size / 2, cy = size / 2, R = size / 2 - 2, rArc = size / 2 - 5;
  const circ = 2 * Math.PI * rArc;
  const dash = circ * (seconds / total);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={R} fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={rArc} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2.5} />
        <circle
          cx={cx}
          cy={cy}
          r={rArc}
          fill="none"
          stroke={col}
          strokeWidth={2.5}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 1s linear, stroke 0.4s" }}
        />
      </svg>
      <span style={{ fontSize: 12, fontWeight: 800, color: col, lineHeight: 1 }}>{seconds}s</span>
    </div>
  );
}

function BetPill({ amount }) {
  if (!amount) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 999,
        background: "rgba(6,12,8,0.82)",
        border: `1px solid ${C.gold}66`,
        marginTop: 2,
      }}
    >
      <Chip3D amountBB={amount} size={14} />
      <span style={{ fontSize: 12, fontWeight: 800, color: C.goldSoft, fontFamily: font }}>
        {amount} <span style={{ opacity: 0.6, fontWeight: 600 }}>bb</span>
      </span>
    </div>
  );
}

// ─── Seat de vilão (posição colorida, hover, presente sempre) ──────────────
function Seat({ left, top, label, sub, stack, inHand }) {
  const cfg = POS_CFG[label] || { bg: C.panel2, ring: C.line };
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        opacity: inHand ? 1 : 0.55,
      }}
    >
      <div
        className="pt-seat-circle"
        style={{
          "--seat-glow": `${cfg.ring}77`,
          display: "grid",
          placeItems: "center",
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: `linear-gradient(145deg,${cfg.bg}ee,${cfg.bg})`,
          border: `2px solid ${cfg.ring}`,
          color: "#fff",
          fontWeight: 800,
          fontSize: 12,
          fontFamily: font,
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </div>

      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{sub}</span>

      {inHand && (
        <>
          <span style={{ fontSize: 14, fontWeight: 900, color: C.text, fontFamily: font, lineHeight: 1 }}>{stack}</span>
          <div style={{ display: "flex", gap: 3, marginTop: 1 }}>
            <Card faceDown size="mini" />
            <Card faceDown size="mini" />
          </div>
        </>
      )}
    </div>
  );
}

function FlyingChips({ chips, onDone }) {
  return (
    <>
      <style>{`
        @keyframes pt-fly-chip {
          0% { transform: translate(0,0) scale(1); opacity: 1; }
          75% { opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.5); opacity: 0; }
        }
      `}</style>
      {chips.map((c) => (
        <div
          key={c.id}
          onAnimationEnd={() => onDone(c.id)}
          style={{
            position: "fixed",
            left: c.from.x,
            top: c.from.y,
            zIndex: 9999,
            pointerEvents: "none",
            "--dx": `${c.to.x - c.from.x}px`,
            "--dy": `${c.to.y - c.from.y}px`,
            animation: "pt-fly-chip 0.5s cubic-bezier(.4,0,.2,1) forwards",
            animationDelay: `${c.delay}ms`,
          }}
        >
          <Chip3D amountBB={c.amountBB} size={18} />
        </div>
      ))}
    </>
  );
}

export default function PokerTable({ seats, pot, board, hero, children, heroTimer, betEvent }) {
  const heroCircleRef = useRef(null);
  const potRef = useRef(null);
  const [flyChips, setFlyChips] = useState([]);
  const flyId = useRef(0);
  const lastEvent = useRef(null);

  useEffect(() => {
    if (!betEvent || betEvent === lastEvent.current) return;
    lastEvent.current = betEvent;
    const type = String(betEvent.action || "").toUpperCase();
    if (type !== "CALL" && type !== "BET") return;
    if (!heroCircleRef.current || !potRef.current) return;

    const hr = heroCircleRef.current.getBoundingClientRect();
    const pr = potRef.current.getBoundingClientRect();
    const count = 3;
    for (let i = 0; i < count; i++) {
      const id = ++flyId.current;
      setTimeout(() => {
        setFlyChips((prev) => [
          ...prev,
          {
            id,
            from: { x: hr.left + hr.width / 2 - 9 + (i - 1) * 6, y: hr.top + hr.height / 2 - 9 },
            to: { x: pr.left + pr.width / 2 - 9, y: pr.top + pr.height / 2 - 9 },
            amountBB: betEvent.sizing || 1,
            delay: 0,
          },
        ]);
      }, i * 60);
    }
  }, [betEvent]);

  const removeChip = (id) => setFlyChips((prev) => prev.filter((c) => c.id !== id));

  // Preenche o board até 5 slots — revelados vêm do solver, os que faltam
  // aparecem como espaços vazios rotulados, igual ao layout do Figma.
  const paddedBoard = [...board];
  while (paddedBoard.length < 5) {
    const i = paddedBoard.length;
    paddedBoard.push({ empty: true, label: i === 3 ? "Turn" : i === 4 ? "River" : undefined });
  }

  const heroBetAmount =
    betEvent && ["CALL", "BET"].includes(String(betEvent.action || "").toUpperCase()) ? betEvent.sizing : undefined;

  const heroSeat = seats.find((s) => s.active) || {};
  const villainSeats = seats.filter((s) => !s.active);
  const potCount = Math.min(5, Math.max(2, Math.ceil((Number(pot) || 0) / 20)));

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        background: "#000000",
        border: `1px solid ${C.line}`,
        padding: 14,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <style>{`
        .pt-seat-circle { transition: transform .15s ease, box-shadow .15s ease; cursor: default; }
        .pt-seat-circle:hover { transform: scale(1.1); box-shadow: 0 0 0 4px var(--seat-glow, transparent), 0 0 18px var(--seat-glow, transparent); }
      `}</style>

      <div
        style={{
          position: "relative",
          height: 480,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at 50% 35%, #1a5c42 0%, #0f3d2c 50%, #08251b 100%)",
          boxShadow: "inset 0 10px 50px rgba(0,0,0,0.7), inset 0 0 120px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: "6%", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "12%",
            transform: "translateX(-50%)",
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: "0.5em",
            color: "rgba(255,255,255,0.05)",
            fontFamily: font,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          POKERSYNC
        </div>

        {/* Board */}
        <div style={{ position: "absolute", left: "50%", top: "36%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.22em", color: "rgba(255,255,255,0.2)", fontFamily: font }}>
            FLOP · TURN · RIVER
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            {paddedBoard.map((c, i) => (
              <Card key={i} {...c} size="board" />
            ))}
          </div>
        </div>

        {/* Pote — fichas 3D somando ao centro */}
        <div ref={potRef} style={{ position: "absolute", left: "50%", top: "56%", transform: "translate(-50%,-50%)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 18px 6px 10px",
              borderRadius: 999,
              background: "rgba(4,20,12,0.8)",
              border: `1px solid ${C.gold}55`,
              boxShadow: `0 0 20px ${C.gold}1a`,
            }}
          >
            <ChipStack amountBB={Number(pot) || 0} count={potCount} size={18} />
            <span style={{ fontSize: 20, fontWeight: 900, color: C.text, fontFamily: font }}>
              {pot} <span style={{ fontSize: 13, opacity: 0.55, fontWeight: 700 }}>bb</span>
            </span>
          </div>
        </div>

        {/* Vilões — todos os 7 lugares aparecem sempre, coloridos por posição */}
        {villainSeats.map((s, i) => (
          <Seat key={i} {...s} />
        ))}
      </div>

      {/* Faixa do herói + cartas + ações — fluxo normal, sem sobrepor nada */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {heroTimer !== undefined && <Clock seconds={heroTimer} total={30} />}
          <div
            ref={heroCircleRef}
            className="pt-seat-circle"
            style={{
              "--seat-glow": `${(POS_CFG[heroSeat.label] || {}).ring || C.gold}77`,
              display: "grid",
              placeItems: "center",
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: `linear-gradient(145deg,${(POS_CFG[heroSeat.label] || {}).bg || "#1a4a3a"}ee,${(POS_CFG[heroSeat.label] || {}).bg || "#0d2a20"})`,
              border: `3px solid ${(POS_CFG[heroSeat.label] || {}).ring || C.gold}`,
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              fontFamily: font,
            }}
          >
            {heroSeat.label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{heroSeat.sub}</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: C.text, fontFamily: font }}>{heroSeat.stack}</span>
          </div>
          <BetPill amount={heroBetAmount} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {hero.map((c, i) => (
            <Card key={i} {...c} size="hero" />
          ))}
        </div>

        {children}
      </div>

      <FlyingChips chips={flyChips} onDone={removeChip} />
    </div>
  );
}

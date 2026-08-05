import React, { useEffect, useRef, useState } from "react";
import { C } from "../theme.js";
import Card from "./Card.jsx";

const font = "'Rajdhani', system-ui, sans-serif";

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
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.gold, border: "1.5px solid #12574A", display: "inline-block" }} />
      <span style={{ fontSize: 12, fontWeight: 800, color: C.goldSoft, fontFamily: font }}>
        {amount} <span style={{ opacity: 0.6, fontWeight: 600 }}>bb</span>
      </span>
    </div>
  );
}

// Cadeira vazia: seat existe na mesa mas não tem jogador/ação nesta mão.
function EmptySeat({ left, top }) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        transform: "translate(-50%, -50%)",
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "1.5px dashed rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.015)",
      }}
    />
  );
}

function Seat({ left, top, label, sub, stack, active, heroTimer, circleRef, betAmount }) {
  const size = active ? 52 : 36;
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
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: active ? 8 : 0 }}>
        {active && heroTimer !== undefined && <Clock seconds={heroTimer} total={30} />}
        <div
          ref={circleRef}
          style={{
            display: "grid",
            placeItems: "center",
            width: size,
            height: size,
            borderRadius: "50%",
            background: active ? "linear-gradient(145deg,#1a4a3a,#0d2a20)" : C.panel2,
            border: `${active ? 3 : 2}px solid ${active ? C.gold : C.line}`,
            boxShadow: active ? `0 0 0 4px ${C.gold}22, 0 0 16px ${C.gold}33` : "none",
            color: active ? C.goldSoft : C.sub,
            fontWeight: 800,
            fontSize: active ? 15 : 12,
            fontFamily: font,
            letterSpacing: "0.03em",
          }}
        >
          {label}
        </div>
      </div>

      <span style={{ fontSize: 11, color: active ? C.goldSoft : C.sub }}>{sub}</span>

      <span
        style={{
          fontSize: active ? 18 : 14,
          fontWeight: 900,
          color: C.text,
          fontFamily: font,
          letterSpacing: "0.02em",
          lineHeight: 1,
        }}
      >
        {stack}
      </span>

      {/* Verso das cartas: só para vilão com ação real na mão (nunca no herói, nunca em cadeira vazia) */}
      {!active && (
        <div style={{ display: "flex", gap: 3, marginTop: 1 }}>
          <Card faceDown size="mini" />
          <Card faceDown size="mini" />
        </div>
      )}

      <BetPill amount={betAmount} />
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
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: `radial-gradient(circle at 35% 30%, #fff6d8, ${C.gold})`,
            border: "2px solid #12574A",
            boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            zIndex: 9999,
            pointerEvents: "none",
            "--dx": `${c.to.x - c.from.x}px`,
            "--dy": `${c.to.y - c.from.y}px`,
            animation: "pt-fly-chip 0.5s cubic-bezier(.4,0,.2,1) forwards",
            animationDelay: `${c.delay}ms`,
          }}
        />
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
            from: { x: hr.left + hr.width / 2 - 8 + (i - 1) * 6, y: hr.top + hr.height / 2 - 8 },
            to: { x: pr.left + pr.width / 2 - 8, y: pr.top + pr.height / 2 - 8 },
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

  return (
    <div
      style={{
        position: "relative",
        height: 640,
        borderRadius: 20,
        overflow: "hidden",
        background: "linear-gradient(145deg,#52341a 0%,#2e1c0b 55%,#1a0d04 100%)",
        border: `1px solid ${C.line}`,
        boxShadow: "0 14px 60px rgba(0,0,0,0.65), inset 0 0 0 2px rgba(255,220,120,0.06)",
        padding: 14,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
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
        <div style={{ position: "absolute", left: "50%", top: "38%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.22em", color: "rgba(255,255,255,0.2)", fontFamily: font }}>
            FLOP · TURN · RIVER
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            {paddedBoard.map((c, i) => (
              <Card key={i} {...c} size="board" />
            ))}
          </div>
        </div>

        {/* Pote */}
        <div ref={potRef} style={{ position: "absolute", left: "50%", top: "54%", transform: "translate(-50%,-50%)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 18px 6px 12px",
              borderRadius: 999,
              background: "rgba(4,20,12,0.8)",
              border: `1px solid ${C.gold}55`,
              boxShadow: `0 0 20px ${C.gold}1a`,
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: `radial-gradient(circle at 35% 30%, #fff6d8, ${C.gold})`,
                border: "2px solid #12574A",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 20, fontWeight: 900, color: C.text, fontFamily: font }}>
              {pot} <span style={{ fontSize: 13, opacity: 0.55, fontWeight: 700 }}>bb</span>
            </span>
          </div>
        </div>

        {/* Seats — sempre 8, alguns podem estar vazios (sem jogador/ação nesta mão) */}
        {seats.map((s, i) =>
          s.empty ? (
            <EmptySeat key={i} left={s.left} top={s.top} />
          ) : (
            <Seat
              key={i}
              {...s}
              heroTimer={s.active ? heroTimer : undefined}
              circleRef={s.active ? heroCircleRef : undefined}
              betAmount={s.active ? heroBetAmount : undefined}
            />
          )
        )}
      </div>

      {/* Cartas do herói + ActionBar */}
      <div style={{ position: "absolute", left: "50%", bottom: 18, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%" }}>
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

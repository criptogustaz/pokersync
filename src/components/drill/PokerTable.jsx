import React from "react";
import { C } from "../theme.js";
import Card from "./Card.jsx";

function Seat({ left, top, label, sub, stack, active }) {
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
      <div
        style={{
          display: "grid",
          placeItems: "center",
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: C.panel2,
          border: `2px solid ${active ? C.gold : C.line}`,
          boxShadow: active ? "0 0 0 3px rgba(47,184,154,0.30)" : "none",
          color: active ? C.goldSoft : C.sub,
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        {label}
      </div>
      <span style={{ fontSize: 11, color: active ? C.goldSoft : C.sub }}>{sub}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{stack}</span>
    </div>
  );
}

export default function PokerTable({ seats, pot, board, hero, children }) {
  return (
    <div
      style={{
        position: "relative",
        height: 600,
        borderRadius: 20,
        background: C.panel,
        border: `1px solid ${C.line}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "70px 90px",
          borderRadius: "180px / 120px",
          background: "radial-gradient(120% 120% at 50% 40%, #12574A 0%, #0E3A32 55%, #0B2620 100%)",
          border: "10px solid #0B2620",
          boxShadow: "inset 0 0 60px rgba(0,0,0,0.55), 0 20px 60px rgba(0,0,0,0.5)",
        }}
      />
      <div style={{ position: "absolute", inset: "70px 90px", borderRadius: "180px / 120px", border: "2px solid rgba(47,184,154,0.30)" }} />

      {seats.map((s, i) => (
        <Seat key={i} {...s} />
      ))}

      <div style={{ position: "absolute", left: "50%", top: "41%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: C.goldSoft, letterSpacing: "0.14em", textTransform: "uppercase" }}>Pote</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginTop: 2 }}>
          <span style={{ width: 16, height: 16, borderRadius: "50%", background: C.gold, border: "2px dashed #12574A", display: "inline-block", verticalAlign: "middle", marginRight: 6 }} />
          {pot} bb
        </div>
      </div>

      <div style={{ position: "absolute", left: "50%", top: "56%", transform: "translate(-50%,-50%)", display: "flex", gap: 8 }}>
        {board.map((c, i) => (
          <Card key={i} {...c} size="board" />
        ))}
      </div>

      <div style={{ position: "absolute", left: "50%", bottom: 16, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {hero.map((c, i) => (
            <Card key={i} {...c} size="hero" />
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}

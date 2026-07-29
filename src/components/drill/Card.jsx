import React from "react";
import { C } from "../theme.js";

const SUITS = {
  h: { glyph: "♥", color: C.suit.h },
  d: { glyph: "♦", color: C.suit.d },
  s: { glyph: "♠", color: C.suit.s },
  c: { glyph: "♣", color: C.suit.c },
};

const SIZES = {
  board: { w: 54, h: 76, rank: 15, suit: 12, center: 26, radius: 9 },
  hero: { w: 62, h: 88, rank: 18, suit: 14, center: 32, radius: 10 },
};

const serif = 'Georgia, "Times New Roman", serif';

export default function Card({ rank, suit, faceDown = false, size = "board" }) {
  const s = SIZES[size] || SIZES.board;

  if (faceDown) {
    return (
      <div
        style={{
          width: s.w,
          height: s.h,
          borderRadius: s.radius,
          background: "linear-gradient(135deg, #0E3A32, #0B2620)",
          border: "2px solid #12574A",
          boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.12), 0 6px 14px rgba(0,0,0,0.5)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <span style={{ fontSize: s.center, color: "rgba(47,184,154,0.35)", opacity: 0.35 }}>♠</span>
      </div>
    );
  }

  const info = SUITS[suit] || SUITS.s;
  const Corner = ({ mirror }) => (
    <div
      style={{
        position: "absolute",
        ...(mirror
          ? { right: 6, bottom: 5, transform: "rotate(180deg)" }
          : { left: 6, top: 5 }),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        lineHeight: 1,
        color: info.color,
        fontFamily: serif,
      }}
    >
      <span style={{ fontSize: s.rank, fontWeight: 700 }}>{rank}</span>
      <span style={{ fontSize: s.suit }}>{info.glyph}</span>
    </div>
  );

  return (
    <div
      style={{
        position: "relative",
        width: s.w,
        height: s.h,
        borderRadius: s.radius,
        background: "linear-gradient(160deg, #FCFCF9, #ECECE4)",
        border: "1px solid #D6D6CC",
        boxShadow: "0 6px 14px rgba(0,0,0,0.5)",
      }}
    >
      <Corner mirror={false} />
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          fontSize: s.center,
          color: info.color,
          opacity: 0.92,
          fontFamily: serif,
        }}
      >
        {info.glyph}
      </span>
      <Corner mirror />
    </div>
  );
}

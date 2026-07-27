import React from "react";

const SUITS = {
  h: { glyph: "♥", color: "#D4183D" },
  d: { glyph: "♦", color: "#D4183D" },
  s: { glyph: "♠", color: "#1A1A1A" },
  c: { glyph: "♣", color: "#1A1A1A" },
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
          background: "linear-gradient(135deg, #0F3D2E, #0B2D22)",
          border: "2px solid #1C5C46",
          boxShadow: "inset 0 0 0 2px rgba(228,197,90,0.18), 0 6px 14px rgba(0,0,0,0.5)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <span style={{ fontSize: s.center, color: "#E4C55A", opacity: 0.35 }}>♠</span>
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

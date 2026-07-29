import React from "react";

/**
 * Logo oficial PokerSync — ícone de cartas empilhadas + tipografia.
 * Fiel ao brand manual: branco puro, traço fino, Space Grotesk.
 */
export default function Logo({ center, size = "md" }) {
  const sizes = {
    sm: { icon: 28, text: 16, gap: 6, letter: "0.22em" },
    md: { icon: 36, text: 20, gap: 8, letter: "0.22em" },
    lg: { icon: 52, text: 30, gap: 12, letter: "0.24em" },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: s.gap,
        justifyContent: center ? "center" : "flex-start",
      }}
    >
      {/* Ícone: cartas empilhadas com espada + linhas de sync */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="12" y="6" width="32" height="44" rx="4"
          transform="rotate(-8 12 6)"
          stroke="#FFFFFF" strokeWidth="2" fill="none"
        />
        <rect
          x="18" y="10" width="32" height="44" rx="4"
          stroke="#FFFFFF" strokeWidth="2" fill="none"
        />
        <path
          d="M34 22c0 0-6 4.5-6 9 0 3.2 2.7 5 6 5s6-1.8 6-5c0-4.5-6-9-6-9z"
          fill="#FFFFFF"
        />
        <path d="M34 35v5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M31 39h6" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="54" y1="24" x2="60" y2="24" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <line x1="54" y1="30" x2="62" y2="30" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <line x1="54" y1="36" x2="58" y2="36" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </svg>

      <span
        style={{
          fontSize: s.text,
          fontWeight: 600,
          letterSpacing: s.letter,
          color: "#FFFFFF",
          textTransform: "uppercase",
          fontFamily: '"Space Grotesk", sans-serif',
        }}
      >
        <span style={{ fontWeight: 700 }}>POKER</span>
        <span style={{ fontWeight: 300, opacity: 0.55 }}>SYNC</span>
      </span>
    </div>
  );
}

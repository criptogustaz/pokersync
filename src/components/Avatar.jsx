import React from "react";
import { Spade, Heart, Diamond, Club, Star, Crown } from "lucide-react";
import { C } from "./theme.js";

// 6 avatares poker-themed. O Heart do lucide já vem com a ponta pra baixo
// (formato correto de coração); usamos `fill` para preencher e o mesmo
// tratamento de cor dos naipes reais do baralho.
export const AVATARS = [
  { id: 1, icon: Spade,   bg: "rgba(255,255,255,0.06)", fg: "#FFFFFF",    border: "rgba(255,255,255,0.14)" },
  { id: 2, icon: Heart,   bg: "rgba(210,59,78,0.15)",   fg: C.suit.h,     border: "rgba(210,59,78,0.5)"    },
  { id: 3, icon: Diamond, bg: "rgba(46,125,209,0.15)",  fg: C.suit.d,     border: "rgba(46,125,209,0.5)"   },
  { id: 4, icon: Club,    bg: "rgba(46,158,91,0.15)",   fg: C.suit.c,     border: "rgba(46,158,91,0.5)"    },
  { id: 5, icon: Star,    bg: "rgba(224,178,76,0.15)",  fg: "#E0B24C",    border: "rgba(224,178,76,0.5)"   },
  { id: 6, icon: Crown,   bg: "rgba(224,89,158,0.15)",  fg: "#E0559E",    border: "rgba(224,89,158,0.5)"   },
];

export function getAvatar(id) {
  return AVATARS.find((a) => a.id === Number(id)) || AVATARS[0];
}

export default function Avatar({ id = 1, size = 38, onClick, title }) {
  const a = getAvatar(id);
  const Icon = a.icon;
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: "grid",
        placeItems: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background: a.bg,
        color: a.fg,
        border: `1.5px solid ${a.border}`,
        cursor: onClick ? "pointer" : "default",
        padding: 0,
        transition: "transform .15s, background .2s",
      }}
    >
      <Icon size={size * 0.5} fill={a.fg} strokeWidth={0} />
    </button>
  );
}

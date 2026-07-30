import React from "react";
import { Spade, Diamond, Club } from "lucide-react";
import { C } from "./theme.js";

// 3 avatares poker-themed
export const AVATARS = [
  { id: 1, icon: Spade,   bg: C.gold,                fg: C.accentText, border: "transparent" },
  { id: 2, icon: Diamond, bg: "#0F3D2E",             fg: C.gold,       border: "transparent" },
  { id: 3, icon: Club,    bg: "rgba(22,24,29,0.9)",  fg: C.gold,       border: C.gold },
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
      }}
    >
      <Icon size={size * 0.5} fill={a.fg} strokeWidth={0} />
    </button>
  );
}

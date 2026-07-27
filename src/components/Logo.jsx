import React from "react";
import { Spade } from "lucide-react";
import { C } from "./theme.js";

export default function Logo({ center }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        justifyContent: center ? "center" : "flex-start",
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 34,
          height: 34,
          borderRadius: 8,
          background: C.felt,
          border: `1px solid ${C.feltEdge}`,
        }}
      >
        <Spade size={18} color={C.goldSoft} fill={C.goldSoft} />
      </span>
      <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.3px", color: C.text }}>
        Poker<span style={{ color: C.gold }}>Sync</span>
      </span>
    </div>
  );
}

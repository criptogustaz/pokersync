import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { C } from "./theme.js";

export default function ModuleCard({ title, desc, icon: Icon, tint, edge, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        position: "relative",
        flex: "none",
        width: 300,
        height: 190,
        borderRadius: 16,
        overflow: "hidden",
        textAlign: "left",
        cursor: "pointer",
        border: `1px solid ${h ? C.gold : C.line}`,
        transform: h ? "scale(1.05)" : "scale(1)",
        boxShadow: h ? "0 22px 50px rgba(0,0,0,0.6)" : "0 6px 18px rgba(0,0,0,0.35)",
        zIndex: h ? 20 : 1,
        background: `linear-gradient(150deg, ${tint}, ${C.panel})`,
        transition: "all .3s",
      }}
    >
      <div style={{ position: "absolute", right: -24, top: -24, opacity: 0.2, color: edge }}>
        <Icon size={150} strokeWidth={1.2} />
      </div>

      <div
        style={{
          position: "relative",
          height: "100%",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 40,
            height: 40,
            borderRadius: 8,
            background: "rgba(0,0,0,0.3)",
            border: `1px solid ${edge}`,
          }}
        >
          <Icon size={20} color={C.goldSoft} />
        </span>

        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{title}</h3>
          <p
            style={{
              fontSize: 13,
              color: C.sub,
              marginTop: 4,
              lineHeight: 1.35,
              maxHeight: h ? 60 : 0,
              opacity: h ? 1 : 0,
              overflow: "hidden",
              transition: "all .3s",
            }}
          >
            {desc}
          </p>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              color: C.gold,
              marginTop: 8,
              opacity: h ? 1 : 0.7,
            }}
          >
            Abrir módulo <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </button>
  );
}

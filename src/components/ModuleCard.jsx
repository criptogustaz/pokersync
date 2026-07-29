import React, { useState } from "react";
import { C } from "./theme.js";

/**
 * Card de módulo do Dashboard.
 * - available=false → estado "EM BREVE" (sem rota, desabilitado).
 * - accent: cor do detalhe no hover (padrão branco, coerente com o tema mono).
 */
export default function ModuleCard({ icon: Icon, title, subtitle, accent = C.accent, tag, available = true, onClick }) {
  const [hovered, setHovered] = useState(false);
  const active = available && !!onClick;
  const hov = hovered && active;

  return (
    <button
      onClick={active ? onClick : undefined}
      disabled={!active}
      aria-disabled={!active}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 1 240px",
        minWidth: 0,
        height: 200,
        background: hov ? C.panel2 : C.panel,
        border: `1px solid ${hov ? "rgba(255,255,255,0.14)" : C.line}`,
        borderRadius: 12,
        cursor: active ? "pointer" : "default",
        opacity: active ? 1 : 0.55,
        transition: "background .25s, border-color .25s, transform .2s, box-shadow .25s",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov ? "0 12px 32px rgba(0,0,0,0.5)" : "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "22px 22px 20px",
        position: "relative",
        overflow: "hidden",
        textAlign: "left",
      }}
    >
      {/* linha de acento no topo (hover) */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent, borderRadius: "12px 12px 0 0", opacity: hov ? 1 : 0, transition: "opacity .25s" }} />

      {/* ícone + tag */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", width: "100%" }}>
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 46,
            height: 46,
            borderRadius: 12,
            background: hov ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${C.line}`,
            transform: hov ? "scale(1.06)" : "scale(1)",
            transition: "transform .3s, background .3s",
          }}
        >
          <Icon size={22} color={C.text} strokeWidth={1.5} />
        </span>
        {(!active || tag) && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: active ? C.text : C.sub,
              background: active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${C.line}`,
              borderRadius: 4,
              padding: "2px 7px",
              opacity: hov ? 1 : 0.75,
              transition: "opacity .2s",
            }}
          >
            {active ? tag : "EM BREVE"}
          </span>
        )}
      </div>

      {/* texto + cta */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0, lineHeight: "22px" }}>{title}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 12, fontWeight: 400, color: C.sub, margin: 0 }}>{subtitle}</p>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.text,
              opacity: hov ? 1 : 0,
              transform: hov ? "translateX(0)" : "translateX(-8px)",
              transition: "opacity .25s, transform .25s",
              whiteSpace: "nowrap",
            }}
          >
            Acessar →
          </span>
        </div>
      </div>
    </button>
  );
}

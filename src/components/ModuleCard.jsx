import React, { useState } from "react";
import { C } from "./theme.js";

/**
 * Card de módulo (novo layout mono com acento por cor).
 * - Largura controlada pelo grid do Dashboard (5 colunas fixas).
 * - `accent` tinge sutilmente ícone, borda, tag, CTA "Acessar →" e halo no HOVER.
 * - `available=false` → estado "EM BREVE" (sem rota, desabilitado).
 */
export default function ModuleCard({ icon: Icon, title, subtitle, accent = "#ffffff", tag, available = true, onClick }) {
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
        width: "100%",
        minWidth: 0,
        minHeight: 168,
        background: hov ? "#1a1a1a" : (C.panel || "#141414"),
        border: `1px solid ${hov ? `${accent}55` : (C.line || "rgba(255,255,255,0.08)")}`,
        borderRadius: 12,
        cursor: active ? "pointer" : "default",
        opacity: active ? 1 : 0.55,
        transition: "background .25s, border-color .25s, transform .2s, box-shadow .25s",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov ? `0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px ${accent}22` : "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "18px 18px 16px",
        position: "relative",
        overflow: "hidden",
        textAlign: "left",
      }}
    >
      {/* linha de acento no topo (hover) */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent, borderRadius: "12px 12px 0 0", opacity: hov ? 1 : 0, transition: "opacity .25s" }} />
      {/* glow suave do accent no hover */}
      <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: `radial-gradient(ellipse at 50% -10%, ${accent}1A 0%, transparent 62%)`, opacity: hov ? 1 : 0, transition: "opacity .3s", pointerEvents: "none" }} />

      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", width: "100%" }}>
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 44,
            height: 44,
            borderRadius: 11,
            background: hov ? `${accent}1F` : "rgba(255,255,255,0.04)",
            border: `1px solid ${hov ? `${accent}55` : (C.line || "rgba(255,255,255,0.08)")}`,
            transform: hov ? "scale(1.06)" : "scale(1)",
            transition: "transform .3s, background .3s, border-color .3s",
          }}
        >
          <Icon size={22} color={hov ? accent : (C.text || "#fff")} strokeWidth={1.5} style={{ transition: "color .25s" }} />
        </span>
        {(!active || tag) && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: active ? accent : (C.sub || "#c4c7c8"),
              background: active ? `${accent}1F` : "rgba(255,255,255,0.05)",
              border: `1px solid ${active ? `${accent}55` : (C.line || "rgba(255,255,255,0.08)")}`,
              borderRadius: 4,
              padding: "2px 6px",
              opacity: hov ? 1 : 0.85,
              transition: "opacity .2s",
            }}
          >
            {active ? tag : (tag || "EM BREVE")}
          </span>
        )}
      </div>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.text || "#fff", margin: 0, lineHeight: "20px" }}>{title}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <p style={{ fontSize: 12, fontWeight: 400, color: C.sub || "#c4c7c8", margin: 0, lineHeight: 1.35 }}>{subtitle}</p>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: accent,
              opacity: hov ? 1 : 0,
              transform: hov ? "translateX(0)" : "translateX(-6px)",
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

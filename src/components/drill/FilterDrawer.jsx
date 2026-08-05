import React, { useState } from "react";
import { Filter, X } from "lucide-react";

// Só as dimensões que existem de verdade nos dados hoje (2.500 spots MTT 40bb ChipEV).
// solution/format/stack não entram aqui porque têm valor único em todos os spots —
// um filtro com 1 opção só não ajuda ninguém, só confunde.
const SECTIONS = [
  {
    key: "position",
    label: "Posição",
    options: ["BB", "BTN", "SB"],
  },
  {
    key: "action",
    label: "Situação",
    options: ["vs Open", "3-Bet"],
  },
  {
    key: "street",
    label: "Rua",
    options: ["Flop", "Turn", "River"],
  },
];

function Pill({ label, active, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: "5px 12px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: '"Space Grotesk", sans-serif',
        cursor: "pointer",
        border: active
          ? "1px solid rgba(255,255,255,0.9)"
          : "1px solid rgba(255,255,255,0.08)",
        background: active ? "#FFFFFF" : h ? "rgba(255,255,255,0.06)" : "#1E1E1E",
        color: active ? "#111111" : h ? "#FFFFFF" : "rgba(255,255,255,0.45)",
        transition: "all .2s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export default function FilterDrawer({ filters, onSet, onReset, activeCount }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Botão de filtro — ícone compacto */}
      <button
        onClick={() => setOpen(true)}
        title="Filtros"
        style={{
          position: "relative",
          display: "grid",
          placeItems: "center",
          width: 38,
          height: 38,
          borderRadius: 10,
          background: activeCount > 0 ? "rgba(255,255,255,0.1)" : "#1E1E1E",
          border: activeCount > 0 ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.08)",
          color: activeCount > 0 ? "#FFFFFF" : "rgba(255,255,255,0.45)",
          cursor: "pointer",
          transition: "all .2s",
        }}
      >
        <Filter size={16} strokeWidth={1.5} />
        {activeCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#FFFFFF",
              color: "#111111",
              fontSize: 9,
              fontWeight: 800,
              display: "grid",
              placeItems: "center",
              lineHeight: 1,
            }}
          >
            {activeCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 100,
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 340,
          height: "100vh",
          background: "#111111",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .3s cubic-bezier(0.4,0,0.2,1)",
          fontFamily: '"Space Grotesk", sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 20px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={15} color="#FFFFFF" strokeWidth={1.5} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>Filtros</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {activeCount > 0 && (
              <button
                onClick={onReset}
                style={{
                  background: "none",
                  border: 0,
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Limpar
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              style={{
                display: "grid",
                placeItems: "center",
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.45)",
                cursor: "pointer",
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Seções de filtros */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 18, lineHeight: 1.5 }}>
            MTT · ChipEV · 40bb — todas as mãos disponíveis hoje são deste formato.
          </p>
          {SECTIONS.map((section) => (
            <div key={section.key} style={{ marginBottom: 22 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: 8,
                }}
              >
                {section.label}
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                {section.options.map((opt) => (
                  <Pill
                    key={opt}
                    label={String(opt)}
                    active={filters[section.key] === opt}
                    onClick={() => onSet(section.key, opt)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => setOpen(false)}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: 0,
              background: "#FFFFFF",
              color: "#111111",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </>
  );
}

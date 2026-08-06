import React, { useEffect, useState } from "react";
import { Filter, X } from "lucide-react";

/* ==================================================================
   FilterDrawer — versão corrigida

   MUDANÇAS
   1. `open` deixou de ser estado interno. Vem do pai por prop, senão
      qualquer remontagem do DrillView (loading, error, empty) apaga
      o estado e o drawer fecha sozinho.
   2. Seleção vira RASCUNHO local. Nada é aplicado até o clique em
      "Aplicar filtros" — antes, cada pill disparava um refetch, que
      derrubava a tela inteira no early return de loading.
   3. Clicar numa pill já ativa desmarca (volta a "todas").

   PROPS
   open: bool
   onOpen / onClose: () => void
   filters: objeto atual do useFilters
   onSet: (key, value) => void     // value null = limpar aquela chave
   onReset: () => void
   activeCount: number

   ATENÇÃO: o `onSet` precisa aceitar `null` para limpar uma chave.
   Se o useFilters ignorar null, troque a linha marcada em `apply()`.
===================================================================*/

const SECTIONS = [
  { key: "position", label: "Posição", options: ["BB", "BTN", "SB"] },
  { key: "action", label: "Situação", options: ["vs Open", "3-Bet"] },
  { key: "street", label: "Rua", options: ["Flop", "Turn", "River"] },
];

const FF = '"Space Grotesk", sans-serif';

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
        fontFamily: FF,
        cursor: "pointer",
        border: active ? "1px solid rgba(255,255,255,0.9)" : "1px solid rgba(255,255,255,0.08)",
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

export default function FilterDrawer({
  open = false,
  onOpen = () => {},
  onClose = () => {},
  filters = {},
  onSet,
  onReset,
  activeCount = 0,
}) {
  // Rascunho: espelha os filtros aplicados sempre que o drawer abre.
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ESC fecha sem aplicar
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const toggle = (key, opt) =>
    setDraft((d) => ({ ...d, [key]: d[key] === opt ? null : opt }));

  const apply = () => {
    SECTIONS.forEach(({ key }) => {
      const next = draft[key] ?? null;
      if (next !== (filters[key] ?? null)) {
        onSet(key, next); // ← se o useFilters não aceitar null, use onSet(key, "")
      }
    });
    onClose();
  };

  const clearDraft = () => setDraft({});

  const draftCount = SECTIONS.filter(({ key }) => draft[key]).length;
  const dirty = SECTIONS.some(({ key }) => (draft[key] ?? null) !== (filters[key] ?? null));

  return (
    <>
      {/* Trigger */}
      <button
        onClick={onOpen}
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
              position: "absolute", top: -4, right: -4, width: 16, height: 16,
              borderRadius: "50%", background: "#FFFFFF", color: "#111111",
              fontSize: 9, fontWeight: 800, display: "grid", placeItems: "center", lineHeight: 1,
            }}
          >
            {activeCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 100, backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Drawer — stopPropagation por garantia, caso algum dia ele passe
          a ser filho do overlay */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed", top: 0, right: 0, width: 340, height: "100vh",
          background: "#111111",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
          zIndex: 101, display: "flex", flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .3s cubic-bezier(0.4,0,0.2,1)",
          fontFamily: FF,
          visibility: open ? "visible" : "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={15} color="#FFFFFF" strokeWidth={1.5} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>Filtros</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {draftCount > 0 && (
              <button
                onClick={clearDraft}
                style={{
                  background: "none", border: 0, color: "rgba(255,255,255,0.35)",
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                  textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: FF,
                }}
              >
                Limpar
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                display: "grid", placeItems: "center", width: 30, height: 30,
                borderRadius: 8, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.45)", cursor: "pointer",
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Seções */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 18, lineHeight: 1.5 }}>
            MTT · ChipEV · 40bb — todas as mãos disponíveis hoje são deste formato.
          </p>
          {SECTIONS.map((section) => (
            <div key={section.key} style={{ marginBottom: 22 }}>
              <p
                style={{
                  fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", marginBottom: 8,
                }}
              >
                {section.label}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {section.options.map((opt) => (
                  <Pill
                    key={opt}
                    label={String(opt)}
                    active={draft[section.key] === opt}
                    onClick={() => toggle(section.key, opt)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={apply}
            style={{
              width: "100%", padding: 12, borderRadius: 10, border: 0,
              background: "#FFFFFF", color: "#111111", fontSize: 13, fontWeight: 700,
              cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.04em",
              fontFamily: FF,
            }}
          >
            {dirty ? "Aplicar filtros" : "Fechar"}
          </button>
          {dirty && (
            <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", marginTop: 8, textAlign: "center" }}>
              As mãos são recarregadas ao aplicar.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

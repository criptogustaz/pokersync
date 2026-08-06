import React, { useEffect, useMemo, useState } from "react";
import { Filter, X } from "lucide-react";

/* ==================================================================
   FilterDrawer v4 — filtro ciente dos dados, sem números na tela

   O problema original: SB + vs Open não existe na base (SB só tem
   3-Bet, BTN só tem vs Open). O drawer oferece 18 combinações e 6
   levariam à tela vazia. A contagem por spot continua sendo calculada
   internamente e usada para desabilitar/cascatear — só não é mais
   exibida: o jogador escolhe o cenário pelo que quer treinar, não pelo
   volume disponível.

   PROPS
   open, onOpen, onClose, filters, onSet, onReset, activeCount
   facets: [{ position, action, street, n }]   ← combinações reais
           Opcional. Se não vier, usa FACETS_FALLBACK abaixo.

   O ideal é o backend expor isto e o drawer consumir, para o filtro
   nunca dessincronizar de uma nova importação de spots:

     GET /api/drills/facets
     select position, action, street, count(*)::int as n
       from drills group by 1,2,3;
===================================================================*/

// Snapshot da base em 06/08/2026 — 2.500 spots. Só fallback: se novos
// spots forem importados, isto envelhece silenciosamente.
const FACETS_FALLBACK = [
  { position: "BB", action: "vs Open", street: "Flop", n: 50 },
  { position: "BB", action: "vs Open", street: "Turn", n: 300 },
  { position: "BB", action: "vs Open", street: "River", n: 900 },
  { position: "BB", action: "3-Bet", street: "Flop", n: 30 },
  { position: "BB", action: "3-Bet", street: "Turn", n: 180 },
  { position: "BB", action: "3-Bet", street: "River", n: 540 },
  { position: "BTN", action: "vs Open", street: "Flop", n: 10 },
  { position: "BTN", action: "vs Open", street: "Turn", n: 60 },
  { position: "BTN", action: "vs Open", street: "River", n: 180 },
  { position: "SB", action: "3-Bet", street: "Flop", n: 10 },
  { position: "SB", action: "3-Bet", street: "Turn", n: 60 },
  { position: "SB", action: "3-Bet", street: "River", n: 180 },
];

const SECTIONS = [
  { key: "position", label: "Posição", options: ["BB", "BTN", "SB"] },
  { key: "action", label: "Situação", options: ["vs Open", "3-Bet"] },
  { key: "street", label: "Rua", options: ["Flop", "Turn", "River"] },
];

const FF = '"Space Grotesk", sans-serif';

function Pill({ label, active, disabled, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      title={disabled ? "Sem mãos para esta combinação" : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 12px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: FF,
        cursor: disabled ? "not-allowed" : "pointer",
        border: active
          ? "1px solid rgba(255,255,255,0.9)"
          : disabled
          ? "1px dashed rgba(255,255,255,0.07)"
          : "1px solid rgba(255,255,255,0.08)",
        background: active ? "#FFFFFF" : disabled ? "transparent" : h ? "rgba(255,255,255,0.06)" : "#1E1E1E",
        color: active ? "#111111" : disabled ? "rgba(255,255,255,0.18)" : h ? "#FFFFFF" : "rgba(255,255,255,0.45)",
        textDecoration: disabled ? "line-through" : "none",
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
  facets,
}) {
  const rows = facets && facets.length ? facets : FACETS_FALLBACK;
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* Contagem por opção considerando as OUTRAS dimensões já escolhidas.
     Usada só para habilitar/desabilitar — nunca exibida na tela. Opção
     com 0 fica desabilitada, é o que impede SB + vs Open. */
  const counts = useMemo(() => {
    const out = {};
    SECTIONS.forEach(({ key, options }) => {
      out[key] = {};
      options.forEach((opt) => {
        out[key][opt] = rows
          .filter((r) => r[key] === opt)
          .filter((r) => SECTIONS.every(({ key: k }) => k === key || !draft[k] || r[k] === draft[k]))
          .reduce((s, r) => s + r.n, 0);
      });
    });
    return out;
  }, [rows, draft]);

  const total = useMemo(
    () =>
      rows
        .filter((r) => SECTIONS.every(({ key }) => !draft[key] || r[key] === draft[key]))
        .reduce((s, r) => s + r.n, 0),
    [rows, draft]
  );

  /* Ao trocar uma dimensão, limpa as outras que ficariam impossíveis:
     escolher SB com "vs Open" marcado limpa a situação em vez de montar
     um filtro sem resultado. */
  const toggle = (key, opt) => {
    setDraft((d) => {
      const next = { ...d, [key]: d[key] === opt ? null : opt };
      SECTIONS.forEach(({ key: k }) => {
        if (k === key || !next[k]) return;
        const ok = rows.some((r) => SECTIONS.every(({ key: kk }) => !next[kk] || r[kk] === next[kk]));
        if (!ok) next[k] = null;
      });
      return next;
    });
  };

  const apply = () => {
    SECTIONS.forEach(({ key }) => {
      const next = draft[key] ?? null;
      if (next !== (filters[key] ?? null)) onSet(key, next);
    });
    onClose();
  };

  const draftCount = SECTIONS.filter(({ key }) => draft[key]).length;
  const dirty = SECTIONS.some(({ key }) => (draft[key] ?? null) !== (filters[key] ?? null));

  return (
    <>
      {/* Gatilho — botão sólido rotulado, pensado para viver dentro da
          barra de contexto (ContextBar), não mais um ícone isolado. */}
      <button
        onClick={onOpen}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          height: 38,
          padding: "0 14px",
          borderRadius: 10,
          background: activeCount > 0 ? "#FFFFFF" : "#1E1E1E",
          border: activeCount > 0 ? "1px solid #FFFFFF" : "1px solid rgba(255,255,255,0.1)",
          color: activeCount > 0 ? "#111111" : "rgba(255,255,255,0.7)",
          cursor: "pointer",
          fontFamily: FF,
          fontSize: 13,
          fontWeight: 700,
          transition: "all .2s",
          whiteSpace: "nowrap",
        }}
      >
        <Filter size={15} strokeWidth={2} />
        Filtros
        {activeCount > 0 && (
          <span
            style={{
              display: "grid",
              placeItems: "center",
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              borderRadius: "50%",
              background: "#111111",
              color: "#FFFFFF",
              fontSize: 9,
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div onClick={onClose} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          zIndex: 100, backdropFilter: "blur(4px)",
        }} />
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed", top: 0, right: 0, width: 340, height: "100vh",
          background: "#111111", borderLeft: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.5)", zIndex: 101,
          display: "flex", flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .3s cubic-bezier(0.4,0,0.2,1)",
          visibility: open ? "visible" : "hidden",
          fontFamily: FF,
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={15} color="#FFFFFF" strokeWidth={1.5} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>Filtros</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {draftCount > 0 && (
              <button onClick={() => setDraft({})} style={{
                background: "none", border: 0, color: "rgba(255,255,255,0.35)",
                fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FF,
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>
                Limpar
              </button>
            )}
            <button onClick={onClose} style={{
              display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.45)", cursor: "pointer",
            }}>
              <X size={14} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 18, lineHeight: 1.5 }}>
            MTT · ChipEV · 40bb — todas as mãos disponíveis hoje são deste formato.
            Opções riscadas não têm spot na base.
          </p>

          {SECTIONS.map((section) => (
            <div key={section.key} style={{ marginBottom: 22 }}>
              <p style={{
                fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", marginBottom: 8,
              }}>
                {section.label}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {section.options.map((opt) => (
                  <Pill
                    key={opt}
                    label={String(opt)}
                    active={draft[section.key] === opt}
                    disabled={counts[section.key][opt] === 0}
                    onClick={() => toggle(section.key, opt)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={apply}
            disabled={total === 0}
            style={{
              width: "100%", padding: 12, borderRadius: 10, border: 0,
              background: total === 0 ? "#2A2A2A" : "#FFFFFF",
              color: total === 0 ? "rgba(255,255,255,0.3)" : "#111111",
              fontSize: 13, fontWeight: 700, fontFamily: FF,
              cursor: total === 0 ? "not-allowed" : "pointer",
              textTransform: "uppercase", letterSpacing: "0.04em",
            }}
          >
            {dirty ? "Aplicar filtros" : "Fechar"}
          </button>
        </div>
      </div>
    </>
  );
}

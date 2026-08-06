import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, AlertTriangle, SkipForward, Filter } from "lucide-react";
import { C, font } from "../theme.js";
import PokerTable from "./PokerTable.jsx";
import ActionBar from "./ActionBar.jsx";
import GtoFeedback from "./GtoFeedback.jsx";
import FilterDrawer from "./FilterDrawer.jsx";
import { useDrillBatch } from "../../services/useDrillBatch.js";
import { useFilters } from "../../services/useFilters.js";
import { useFacets } from "../../services/useFacets.js";
import { parseBoard, parseHeroCombo } from "../../utils/parseBoard.js";

/* ==================================================================
   LAYOUT DE 3 COLUNAS

   O widescreen sobrava ~500px de cada lado da mesa sem uso. Agora:
     ┌──────────────────────────────────────────────────────┐
     │  header                                              │
     ├──────────┬─────────────────────────┬─────────────────┤
     │ filtros  │         MESA            │  GTO Feedback   │
     │ (chips)  │                         │  ou stats       │
     ├──────────┴─────────────────────────┴─────────────────┤
     │              ActionBar (bet sizes)                   │
     └──────────────────────────────────────────────────────┘

   Filtros deixaram de morar em drawer — agora são chips permanentes,
   sempre visíveis. O FilterDrawer sobra como fallback (botão discreto
   no header) pra facets além de posição/ação/rua.

   position: fixed inset: 16 — a tela flutua com respiro, não é
   fullscreen absoluto.
===================================================================*/

const SEAT_INVOLVEMENT = [
  { pos: "BTN", hero: true },
  { pos: "SB", inHand: true },
  { pos: "CO", inHand: true },
  { pos: "UTG", inHand: false },
  { pos: "UTG+1", inHand: false },
  { pos: "HJ", inHand: false },
  { pos: "BB", inHand: true },
  { pos: "MP", inHand: true },
];

/* Snapshot de facets — mesmo fallback que o FilterDrawer usa. */
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

const SIDEBAR_SECTIONS = [
  { key: "position", label: "Posição", options: ["BB", "BTN", "SB"] },
  { key: "action", label: "Situação", options: ["vs Open", "3-Bet"] },
  { key: "street", label: "Rua", options: ["Flop", "Turn", "River"] },
];

function parseActionString(raw) {
  const parts = String(raw).trim().split(/\s+/);
  const type = parts[0].toUpperCase();
  const sizing = parts[1] ? parseFloat(parts[1].replace(",", ".")) : 0;
  return { type, sizing };
}

/* Animações globais */
const GLOBAL_ANIMATIONS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

/* ------------------------------------------------------------------
   SIDEBAR de filtros — chips permanentes, sempre visíveis. Cascateia
   igual ao FilterDrawer: escolher SB com "vs Open" ativo limpa a ação
   (que não existe pra SB). Opções sem spot ficam disabled.
-------------------------------------------------------------------*/
function FilterChip({ label, active, disabled, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      title={disabled ? "Sem mãos para esta combinação" : undefined}
      style={{
        ...font,
        padding: "6px 12px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        border: active
          ? "1px solid rgba(255,255,255,0.9)"
          : disabled
            ? "1px dashed rgba(255,255,255,0.07)"
            : "1px solid rgba(255,255,255,0.10)",
        background: active
          ? "#FFFFFF"
          : disabled
            ? "transparent"
            : h ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
        color: active
          ? "#111111"
          : disabled
            ? "rgba(255,255,255,0.18)"
            : h ? "#FFFFFF" : "rgba(255,255,255,0.55)",
        textDecoration: disabled ? "line-through" : "none",
        transition: "all 160ms ease",
        transform: h && !disabled && !active ? "translateY(-1px)" : "translateY(0)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function FilterSidebar({ filters, onSet, facets, onOpenAdvanced, activeCount }) {
  const rows = facets && facets.length ? facets : FACETS_FALLBACK;

  const counts = useMemo(() => {
    const out = {};
    SIDEBAR_SECTIONS.forEach(({ key, options }) => {
      out[key] = {};
      options.forEach((opt) => {
        out[key][opt] = rows
          .filter((r) => r[key] === opt)
          .filter((r) => SIDEBAR_SECTIONS.every(({ key: k }) => k === key || !filters[k] || r[k] === filters[k]))
          .reduce((s, r) => s + r.n, 0);
      });
    });
    return out;
  }, [rows, filters]);

  const toggle = (key, opt) => {
    const current = filters[key];
    const nextValue = current === opt ? null : opt;
    onSet(key, nextValue);
    // Cascade: limpa outras dimensões que ficariam impossíveis
    SIDEBAR_SECTIONS.forEach(({ key: k }) => {
      if (k === key || !filters[k]) return;
      const ok = rows.some((r) =>
        r[key] === (nextValue ?? r[key]) &&
        SIDEBAR_SECTIONS.every(({ key: kk }) => kk === key || !filters[kk] || r[kk] === filters[kk])
      );
      if (!ok) onSet(k, null);
    });
  };

  return (
    <aside
      style={{
        ...font,
        display: "flex", flexDirection: "column", gap: 18,
        padding: "16px 14px",
        borderRadius: 14,
        background: "linear-gradient(180deg, #0F0F0F, #0A0A0A)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: "0.16em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.4)",
        }}>
          Cenário
        </span>
        {activeCount > 0 && (
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
            background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)",
          }}>
            {activeCount} ativo{activeCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {SIDEBAR_SECTIONS.map((section) => (
        <div key={section.key} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.35)",
          }}>
            {section.label}
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {section.options.map((opt) => (
              <FilterChip
                key={opt}
                label={opt}
                active={filters[section.key] === opt}
                disabled={counts[section.key][opt] === 0}
                onClick={() => toggle(section.key, opt)}
              />
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={onOpenAdvanced}
        style={{
          ...font, marginTop: "auto",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "8px 12px", borderRadius: 10, cursor: "pointer",
          background: "transparent", border: "1px solid rgba(255,255,255,0.10)",
          color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700,
          transition: "all 160ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          e.currentTarget.style.color = "#FFFFFF";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "rgba(255,255,255,0.5)";
        }}
      >
        <Filter size={12} strokeWidth={2} />
        Filtros avançados
      </button>
    </aside>
  );
}

/* ------------------------------------------------------------------
   Painel lateral direito — GtoFeedback ou stats de sessão detalhados.
-------------------------------------------------------------------*/
function RightPanel({ hand, userAction, context, onFeedbackResult, sessionStats }) {
  if (userAction && hand) {
    return (
      <aside style={{ overflowY: "auto", animation: "fadeInUp 240ms ease-out" }}>
        <GtoFeedback
          userAction={userAction}
          gtoNodes={hand.gtoNodes}
          heroCards={hand.heroCards}
          context={context}
          onResult={onFeedbackResult}
        />
      </aside>
    );
  }

  const { hits, total, sessionPct, avgFreq } = sessionStats;
  return (
    <aside
      style={{
        ...font,
        padding: "16px 14px", borderRadius: 14,
        background: "linear-gradient(180deg, #0F0F0F, #0A0A0A)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex", flexDirection: "column", gap: 14,
      }}
    >
      <span style={{
        fontSize: 10, fontWeight: 800, letterSpacing: "0.16em",
        textTransform: "uppercase", color: "rgba(255,255,255,0.4)",
      }}>
        Sessão
      </span>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <StatRow
          label="Acertos GTO"
          value={total > 0 ? `${hits}/${total}` : "—"}
          accent={hits > 0 ? C.pos : null}
        />
        <StatRow
          label="Aproveitamento"
          value={total > 0 ? `${sessionPct}%` : "—"}
        />
        <StatRow
          label="Freq. média jogada"
          value={total > 0 ? `${avgFreq}%` : "—"}
        />
      </div>

      {hand ? (
        <div style={{
          marginTop: "auto", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)",
          fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5,
        }}>
          Escolha uma ação na barra abaixo — o feedback GTO aparece aqui.
        </div>
      ) : (
        <div style={{
          marginTop: "auto", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)",
          fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5,
        }}>
          Selecione posição, situação e rua nos filtros ao lado pra começar.
        </div>
      )}
    </aside>
  );
}

function StatRow({ label, value, accent }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 800, color: accent || "#FFFFFF" }}>{value}</span>
    </div>
  );
}

/* Header inline session + próxima */
function SessionInline({ handIdx, handsTotal, hits, total, sessionPct }) {
  const dim = "rgba(255,255,255,0.4)";
  const soft = "rgba(255,255,255,0.65)";
  return (
    <div style={{ ...font, fontSize: 12, color: dim, display: "flex", gap: 10, alignItems: "baseline" }}>
      <span>
        Mão <span style={{ color: soft, fontWeight: 700 }}>{handIdx}/{handsTotal}</span>
      </span>
      {total > 0 && (
        <>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>
            <span style={{ color: hits > 0 ? C.pos : soft, fontWeight: 700 }}>{hits}/{total}</span>
            {" "}acertos ({sessionPct}%)
          </span>
        </>
      )}
    </div>
  );
}

function NextButton({ onClick }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        background: h ? "#F5F5F5" : "#FFFFFF", color: "#111111",
        border: 0, borderRadius: 10, padding: "8px 16px", cursor: "pointer",
        fontWeight: 700, fontSize: 13, flexShrink: 0,
        transform: h ? "translateY(-1px)" : "translateY(0)",
        boxShadow: h ? "0 6px 18px rgba(255,255,255,0.15)" : "0 2px 6px rgba(0,0,0,0.3)",
        transition: "all 180ms ease",
      }}
    >
      Próxima <SkipForward size={14} />
    </button>
  );
}

export default function DrillView({ onBack }) {
  const { filters, set: setFilter, reset: resetFilters, activeCount, queryString } = useFilters();
  const { hands, loading, error, reload } = useDrillBatch(20, queryString);
  const facets = useFacets();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [userAction, setUserAction] = useState(null);
  const [stats, setStats] = useState({ hits: 0, total: 0, freqSum: 0 });
  const [heroTimer, setHeroTimer] = useState(30);

  const hand = hands[idx] || null;

  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  useEffect(() => {
    setIdx(0);
    setUserAction(null);
  }, [queryString]);

  const board = useMemo(() => (hand ? parseBoard(hand.board) : []), [hand]);

  const heroCardsParsed = useMemo(() => {
    if (!hand?.heroCards) return [];
    return parseHeroCombo(hand.heroCards);
  }, [hand]);

  const context = useMemo(() => {
    if (!hand) return "";
    return `Pot ${hand.pot} · Stack ${hand.effectiveStack} bb`;
  }, [hand]);

  const tableHand = useMemo(() => {
    if (!hand) return null;
    const spr =
      hand.pot > 0 && hand.effectiveStack != null
        ? Math.round((hand.effectiveStack / hand.pot) * 10) / 10
        : null;

    const seats = {};
    SEAT_INVOLVEMENT.forEach(({ pos, hero: isHero, inHand }) => {
      if (isHero) {
        seats[pos] = {
          status: userAction ? "live" : "acting",
          stack: hand.effectiveStack,
          cards: heroCardsParsed,
          ...(userAction ? { action: { type: userAction.action, size: userAction.sizing } } : {}),
        };
      } else if (inHand) {
        seats[pos] = { status: "live", stack: hand.effectiveStack };
      } else {
        seats[pos] = { status: "empty" };
      }
    });

    return { pot: hand.pot, spr, board, history: [], seats };
  }, [hand, board, heroCardsParsed, userAction]);

  const betSizings = useMemo(() => {
    if (!hand?.gtoNodes?.actions) return [];
    const sizings = hand.gtoNodes.actions
      .map(parseActionString)
      .filter((a) => a.type === "BET" && a.sizing > 0)
      .map((a) => a.sizing / 100);
    const unique = Array.from(new Set(sizings)).sort((a, b) => a - b);
    return unique.slice(0, 3);
  }, [hand]);

  useEffect(() => {
    setHeroTimer(30);
  }, [idx]);

  useEffect(() => {
    if (userAction || !hand) return;
    const id = setInterval(() => {
      setHeroTimer((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [userAction, idx, hand]);

  const onAction = useCallback((action, size) => {
    setUserAction({ action, sizing: size });
  }, []);

  const nextHand = useCallback(() => {
    setUserAction(null);
    if (idx + 1 < hands.length) {
      setIdx((i) => i + 1);
    } else {
      reload();
      setIdx(0);
    }
  }, [idx, hands.length, reload]);

  const onFeedbackResult = useCallback((result) => {
    setStats((prev) => ({
      hits: prev.hits + (result.verdict === "PERFECT" ? 1 : 0),
      total: prev.total + 1,
      freqSum: prev.freqSum + (result.chosenFreq ?? 0),
    }));
  }, []);

  const sessionPct = stats.total > 0 ? Math.round((stats.hits / stats.total) * 100) : 0;
  const avgFreq = stats.total > 0 ? Math.round((stats.freqSum / stats.total) * 100) : 0;

  return (
    <div
      style={{
        ...font,
        position: "fixed",
        inset: 16,               /* respiro nas bordas — não é fullscreen */
        background: "#050505",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",   /* header, corpo, rodapé */
        gap: 12,
        padding: 14,
        boxSizing: "border-box",
        overflow: "hidden",
        zIndex: 40,
        animation: "fadeInUp 220ms ease-out",
      }}
    >
      <style>{GLOBAL_ANIMATIONS}</style>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onBack}
          title="Voltar"
          style={{
            display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 10,
            background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.10)",
            color: "rgba(255,255,255,0.55)", cursor: "pointer",
            transition: "all 180ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#252525"; e.currentTarget.style.color = "#FFFFFF"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
          Modo Treino
        </h1>
        <div style={{ flex: 1, minWidth: 0 }}>
          {hand && (
            <SessionInline
              handIdx={idx + 1}
              handsTotal={hands.length}
              hits={stats.hits}
              total={stats.total}
              sessionPct={sessionPct}
            />
          )}
        </div>
        {userAction && hand && <NextButton onClick={nextHand} />}
      </div>

      {/* CORPO: 3 COLUNAS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px minmax(0, 1fr) 280px",
          gap: 12,
          minHeight: 0,
        }}
      >
        <FilterSidebar
          filters={filters}
          onSet={setFilter}
          facets={facets}
          onOpenAdvanced={() => setFiltersOpen(true)}
          activeCount={activeCount}
        />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: 0 }}>
          {hand ? (
            <div style={{ width: "100%", height: "100%", maxWidth: 820, maxHeight: 460, margin: "auto" }}>
              <PokerTable hand={tableHand} heroTimer={heroTimer} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              {loading ? (
                <>
                  <Loader2 size={32} color="rgba(255,255,255,0.5)" style={{ animation: "spin 1s linear infinite" }} />
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Carregando mãos...</p>
                </>
              ) : error ? (
                <>
                  <AlertTriangle size={32} color={C.neg} />
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Erro ao carregar mãos.</p>
                  <button
                    onClick={reload}
                    style={{ background: "#FFFFFF", color: "#111111", border: 0, borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
                  >
                    Tentar novamente
                  </button>
                </>
              ) : (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, textAlign: "center", maxWidth: 320 }}>
                  {activeCount > 0
                    ? "Nenhuma mão encontrada para esses filtros."
                    : "Selecione posição, situação e rua nos filtros ao lado pra começar."}
                </p>
              )}
            </div>
          )}
        </div>

        <RightPanel
          hand={hand}
          userAction={userAction}
          context={context}
          onFeedbackResult={onFeedbackResult}
          sessionStats={{ hits: stats.hits, total: stats.total, sessionPct, avgFreq }}
        />
      </div>

      {/* RODAPÉ: ActionBar sempre presente quando há mão. Slot com
          min-height garante que ela nunca some silenciosamente por
          falta de espaço. */}
      <div
        style={{
          minHeight: 72,
          display: "flex",
          alignItems: "center",
          padding: "0 4px",
        }}
      >
        {hand && !userAction && (
          <div style={{ width: "100%", animation: "fadeInUp 220ms ease-out" }}>
            <ActionBar
              pot={hand.pot}
              betSizings={betSizings}
              onAction={onAction}
              callAmount={Math.round(hand.pot * 0.5 * 10) / 10}
            />
          </div>
        )}
        {hand && userAction && (
          <div style={{
            ...font, width: "100%",
            padding: "12px 16px", borderRadius: 12,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            fontSize: 12, color: "rgba(255,255,255,0.5)",
            textAlign: "center",
          }}>
            Ação registrada — leia o feedback à direita e siga pra próxima mão.
          </div>
        )}
      </div>

      {/* FilterDrawer avançado — botão do sidebar abre este */}
      <FilterDrawer
        open={filtersOpen}
        onOpen={() => setFiltersOpen(true)}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onSet={setFilter}
        onReset={resetFilters}
        activeCount={activeCount}
        facets={facets}
      />
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, AlertTriangle, SkipForward, ChevronRight } from "lucide-react";
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
   LAYOUT SEM SCROLL

   Container = 100vh, flex column, overflow hidden. Cada bloco ocupa
   sua faixa fixa; a mesa é a única que se expande (flex: 1) para
   preencher o que sobrar.

     header       ~48px fixo — inclui a strip de sessão inline
     context bar  ~48px fixo — cenário + gatilho do FilterDrawer
     mesa          flex:1  — cresce/encolhe conforme a viewport
     rodapé       ~80px fixo — ActionBar OU GtoFeedback

   O PokerTable perdeu o slot `children` de novo: a barra de ação vive
   fora dele, como irmã. Isso deixa o rodapé com altura previsível
   independentemente do que o PokerTable renderiza por dentro.
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

const FILTER_LABELS = {
  street: "Street",
  action: "Ação",
  position: "Posição",
  heroPosition: "Posição",
  villainPosition: "Vilão",
  stack: "Stack",
  effectiveStack: "Stack",
  format: "Formato",
};

const NEUTRAL_VALUES = new Set(["", "Qualquer", "Todos", "Todas", "Ambos", "Any", "all"]);

function parseActionString(raw) {
  const parts = String(raw).trim().split(/\s+/);
  const type = parts[0].toUpperCase();
  const sizing = parts[1] ? parseFloat(parts[1].replace(",", ".")) : 0;
  return { type, sizing };
}

/* ------------------------------------------------------------------
   Barra de contexto — controle primário do cenário. Sem overflow-x:
   com no máximo 3 chips (posição/ação/rua) cabe em qualquer viewport.
-------------------------------------------------------------------*/
function ContextBar({ filters, onOpen, children }) {
  const chips = useMemo(() => {
    return Object.entries(filters || {})
      .filter(([, v]) => {
        if (Array.isArray(v)) return v.length > 0;
        return v !== null && v !== undefined && !NEUTRAL_VALUES.has(String(v));
      })
      .map(([k, v]) => ({
        key: k,
        label: FILTER_LABELS[k] || k,
        value: Array.isArray(v) ? v.join(" · ") : String(v),
      }));
  }, [filters]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 8px 6px 14px",
        borderRadius: 12,
        background: "#141414",
        border: "1px solid rgba(255,255,255,0.10)",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "rgba(255,255,255,0.28)",
          flexShrink: 0,
        }}
      >
        Cenário
      </span>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flex: 1,
          minWidth: 0,
          flexWrap: "wrap",
        }}
      >
        {chips.length === 0 ? (
          <button
            onClick={onOpen}
            style={{
              ...font,
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Nenhum filtro aplicado — escolha uma situação para treinar
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        ) : (
          chips.map((chip, i) => (
            <React.Fragment key={chip.key}>
              {i > 0 && <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 12 }}>›</span>}
              <button
                onClick={onOpen}
                title={`${chip.label}: ${chip.value}`}
                style={{
                  ...font,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                  padding: "4px 9px",
                  borderRadius: 7,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  {chip.label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>{chip.value}</span>
              </button>
            </React.Fragment>
          ))
        )}
      </div>

      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Session inline no header — 1 linha, tipografia pequena.
-------------------------------------------------------------------*/
function SessionInline({ handIdx, handsTotal, hits, total, sessionPct, avgFreq }) {
  const dim = "rgba(255,255,255,0.35)";
  const soft = "rgba(255,255,255,0.55)";
  return (
    <div style={{ ...font, fontSize: 12, color: dim, display: "flex", gap: 10, alignItems: "baseline" }}>
      <span>
        Mão <span style={{ color: soft, fontWeight: 700 }}>{handIdx}/{handsTotal}</span>
      </span>
      {total > 0 && (
        <>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>
            <span style={{ color: hits > 0 ? C.pos : soft, fontWeight: 700 }}>{hits}/{total}</span> acertos ({sessionPct}%)
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>
            freq <span style={{ color: soft, fontWeight: 700 }}>{avgFreq}%</span>
          </span>
        </>
      )}
    </div>
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

  /* ---------------- Estados vazios (sem mão) ---------------- */
  const emptyState = () => {
    if (loading) {
      return (
        <>
          <Loader2 size={32} color="rgba(255,255,255,0.5)" style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Carregando mãos...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </>
      );
    }
    if (error) {
      return (
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
      );
    }
    return (
      <>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, textAlign: "center" }}>
          {activeCount > 0
            ? "Nenhuma mão encontrada para esses filtros."
            : "Escolha uma situação nos filtros para começar a treinar."}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          {activeCount > 0 && (
            <button
              onClick={resetFilters}
              style={{ background: "#1E1E1E", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
            >
              Limpar filtros
            </button>
          )}
          <button
            onClick={() => setFiltersOpen(true)}
            style={{ background: "#FFFFFF", color: "#111111", border: 0, borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
          >
            {activeCount > 0 ? "Ajustar filtros" : "Definir cenário"}
          </button>
        </div>
      </>
    );
  };

  /* ---------------------------- Render ---------------------------- */
  return (
    <div
      style={{
        ...font,
        background: "#000000",
        height: "100vh",
        maxHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 12,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Header — 1 linha compacta com sessão inline */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button
          onClick={onBack}
          title="Voltar"
          style={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 10, background: "#1E1E1E", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)", cursor: "pointer", flexShrink: 0 }}
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>

        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", margin: 0, flexShrink: 0 }}>
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
              avgFreq={avgFreq}
            />
          )}
        </div>

        {userAction && hand && (
          <button
            onClick={nextHand}
            title="Próxima mão"
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFFFFF", color: "#111111", border: 0, borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13, flexShrink: 0 }}
          >
            Próxima <SkipForward size={14} />
          </button>
        )}
      </div>

      {/* Barra de contexto — sem overflow-x */}
      <ContextBar filters={filters} onOpen={() => setFiltersOpen(true)}>
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
      </ContextBar>

      {/* Mesa (flex:1) — preenche o que sobrar */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative" }}>
        {hand ? (
          <PokerTable hand={tableHand} heroTimer={heroTimer} />
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            {emptyState()}
          </div>
        )}
      </div>

      {/* Rodapé — ActionBar OU GtoFeedback, altura previsível */}
      {hand && (
        <div style={{ flexShrink: 0 }}>
          {userAction ? (
            <GtoFeedback
              userAction={userAction}
              gtoNodes={hand.gtoNodes}
              heroCards={hand.heroCards}
              context={context}
              onResult={onFeedbackResult}
            />
          ) : (
            <ActionBar
              pot={hand.pot}
              betSizings={betSizings}
              onAction={onAction}
              callAmount={Math.round(hand.pot * 0.5 * 10) / 10}
            />
          )}
        </div>
      )}
    </div>
  );
}
